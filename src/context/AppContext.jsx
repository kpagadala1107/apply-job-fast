import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { MOCK_JOBS } from '../data/mockData';
import { fetchJobsFromJSearch } from '../services/jobPortals';
import { parseResume, inferJobRole } from '../services/resumeParser';
import { getOrCreateSession, isSupabaseConfigured, uploadResumeFile } from '../services/supabase';
import {
  dbSaveResume, dbLoadResume,
  dbSaveTailoredResume, dbLoadTailoredResumes,
  dbSaveAppliedJob, dbLoadAppliedJobs,
} from '../services/db';

export const USE_LIVE_API = !!import.meta.env.VITE_RAPIDAPI_KEY;

const AppContext = createContext(null);

const initialState = {
  resume: null,
  portals: { linkedin: false, indeed: false, glassdoor: false, ziprecruiter: false, dice: false, monster: false, simplyhired: false },
  dateRange: 'month',
  jobs: [],
  tailoredResumes: {},
  appliedJobs: [],
  loadingJobs: false,
  lastFetched: null,        // ISO timestamp of the most recent live fetch
  jobsFetchedLive: false,   // true when current jobs came from the API
  userId: null,
  dbReady: false,
  dbError: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER_ID':
      return { ...state, userId: action.payload };
    case 'DB_READY':
      return { ...state, dbReady: true };
    case 'DB_ERROR':
      return { ...state, dbError: action.payload, dbReady: true };
    case 'UPLOAD_RESUME':
      return { ...state, resume: action.payload };
    case 'CONNECT_PORTAL':
      return { ...state, portals: { ...state.portals, [action.payload]: true }, loadingJobs: true };
    case 'DISCONNECT_PORTAL': {
      const portals = { ...state.portals, [action.payload]: false };
      const anyConnected = Object.values(portals).some(Boolean);
      return {
        ...state,
        portals,
        // Remove jobs that were fetched via this portal connection
        jobs: anyConnected ? state.jobs.filter((j) => j.connectedVia !== action.payload) : [],
      };
    }
    case 'SET_JOBS':
      return {
        ...state,
        jobs: action.payload.jobs,
        loadingJobs: false,
        lastFetched: action.payload.live ? new Date().toISOString() : state.lastFetched,
        jobsFetchedLive: action.payload.live || state.jobsFetchedLive,
      };
    case 'SET_LOADING':
      return { ...state, loadingJobs: action.payload };
    case 'SAVE_TAILORED_RESUME':
      return {
        ...state,
        tailoredResumes: { ...state.tailoredResumes, [action.payload.jobId]: action.payload.data },
      };
    case 'LOAD_TAILORED_RESUMES':
      return { ...state, tailoredResumes: action.payload };
    case 'MARK_APPLIED':
      return {
        ...state,
        appliedJobs: state.appliedJobs.includes(action.payload)
          ? state.appliedJobs
          : [...state.appliedJobs, action.payload],
      };
    case 'LOAD_APPLIED_JOBS':
      return { ...state, appliedJobs: action.payload };
    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const userIdRef = useRef(null);
  // Track how many live fetches have happened so each gets a different page offset
  const fetchCountRef = useRef(0);

  // ── Boot ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isSupabaseConfigured) {
      dispatch({ type: 'DB_READY' });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const userId = await getOrCreateSession();
        if (cancelled || !userId) {
          dispatch({ type: 'DB_ERROR', payload: 'Could not create Supabase session' });
          return;
        }

        userIdRef.current = userId;
        dispatch({ type: 'SET_USER_ID', payload: userId });

        const [resume, tailoredResumes, appliedJobs] = await Promise.all([
          dbLoadResume(userId),
          dbLoadTailoredResumes(userId),
          dbLoadAppliedJobs(userId),
        ]);

        if (cancelled) return;

        if (resume) dispatch({ type: 'UPLOAD_RESUME', payload: resume });
        if (Object.keys(tailoredResumes).length) dispatch({ type: 'LOAD_TAILORED_RESUMES', payload: tailoredResumes });
        if (appliedJobs.length) dispatch({ type: 'LOAD_APPLIED_JOBS', payload: appliedJobs });

        dispatch({ type: 'DB_READY' });
      } catch (err) {
        if (!cancelled) dispatch({ type: 'DB_ERROR', payload: err.message });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getSearchQuery = useCallback((resume) =>
    resume?.searchQuery || resume?.role || inferJobRole(resume?.text || '') || 'Software Engineer',
  []);

  async function fetchAndMerge({ portal, currentJobs, resume, dateRange, page }) {
    const liveJobs = await fetchJobsFromJSearch({ query: getSearchQuery(resume), dateRange, page });
    // Preserve portal = actual source (from detectPortal/job_publisher).
    // Add connectedVia so disconnect correctly removes only jobs from this connection.
    const tagged = liveJobs.map((j) => ({ ...j, connectedVia: portal }));
    const existingIds = new Set(currentJobs.map((j) => j.id));
    return [...currentJobs, ...tagged.filter((j) => !existingIds.has(j.id))];
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  const uploadResume = useCallback(async (file) => {
    dispatch({
      type: 'UPLOAD_RESUME',
      payload: { name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString(), text: '', skills: [], parsing: true },
    });

    let text = '';
    let skills = [];
    let role = 'Software Engineer';
    try {
      ({ text, skills, role } = await parseResume(file));
    } catch (err) {
      console.error('[uploadResume] Parse error:', err.message);
    }

    const parsed = { name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString(), text, skills, role, parsing: false };
    dispatch({ type: 'UPLOAD_RESUME', payload: parsed });

    const userId = userIdRef.current;
    if (!userId) return;

    const storagePath = await uploadResumeFile(userId, file);
    await dbSaveResume({ userId, name: file.name, size: file.size, type: file.type, text, storagePath });
  }, []);

  const connectPortal = useCallback(
    async (portal) => {
      dispatch({ type: 'CONNECT_PORTAL', payload: portal });

      if (USE_LIVE_API) {
        try {
          // Use an incrementing page offset so each connection fetches a different slice
          fetchCountRef.current += 1;
          const page = fetchCountRef.current;
          const merged = await fetchAndMerge({
            portal,
            currentJobs: state.jobs,
            resume: state.resume,
            dateRange: state.dateRange,
            page,
          });
          dispatch({ type: 'SET_JOBS', payload: { jobs: merged, live: true } });
        } catch (err) {
          console.error('[connectPortal] Live fetch failed, falling back to mock data:', err.message);
          loadMockJobs(portal);
        }
      } else {
        setTimeout(() => loadMockJobs(portal), 1200);
      }

      function loadMockJobs(p) {
        const existingIds = state.jobs.map((j) => j.id);
        const fresh = MOCK_JOBS
          .filter((j) => j.portal === p && !existingIds.includes(j.id))
          .map((j) => ({ ...j, connectedVia: p }));
        dispatch({ type: 'SET_JOBS', payload: { jobs: [...state.jobs, ...fresh], live: false } });
      }
    },
    [state.jobs, state.resume, state.dateRange, getSearchQuery]
  );

  // Re-fetches all connected portals with a fresh page offset for new results
  const refreshJobs = useCallback(async () => {
    const connectedPortals = Object.entries(state.portals)
      .filter(([, connected]) => connected)
      .map(([id]) => id);

    if (!connectedPortals.length) return;
    if (!USE_LIVE_API) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Clear jobs from connected portals, keep applied/tailored job IDs intact
      const keepJobs = state.jobs.filter((j) => !connectedPortals.includes(j.connectedVia));
      let result = keepJobs;

      for (const portal of connectedPortals) {
        fetchCountRef.current += 1;
        const page = fetchCountRef.current;
        result = await fetchAndMerge({
          portal,
          currentJobs: result,
          resume: state.resume,
          dateRange: state.dateRange,
          page,
        });
      }
      dispatch({ type: 'SET_JOBS', payload: { jobs: result, live: true } });
    } catch (err) {
      console.error('[refreshJobs] Failed:', err.message);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.portals, state.jobs, state.resume, state.dateRange, getSearchQuery]);

  const disconnectPortal = useCallback((portal) => {
    dispatch({ type: 'DISCONNECT_PORTAL', payload: portal });
  }, []);

  const setDateRange = useCallback((range) => {
    dispatch({ type: 'SET_DATE_RANGE', payload: range });
  }, []);

  const saveTailoredResume = useCallback(async (jobId, data) => {
    dispatch({ type: 'SAVE_TAILORED_RESUME', payload: { jobId, data } });

    const userId = userIdRef.current;
    if (!userId) return;

    await dbSaveTailoredResume({ userId, jobId, content: data });
  }, []);

  const markApplied = useCallback(async (jobId) => {
    dispatch({ type: 'MARK_APPLIED', payload: jobId });

    const userId = userIdRef.current;
    if (!userId) return;

    const job = state.jobs.find((j) => j.id === jobId) ?? MOCK_JOBS.find((j) => j.id === jobId);
    if (job) await dbSaveAppliedJob({ userId, job });
  }, [state.jobs]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        isLive: USE_LIVE_API,
        uploadResume,
        connectPortal,
        disconnectPortal,
        refreshJobs,
        setDateRange,
        saveTailoredResume,
        markApplied,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
