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

const USE_LIVE_API = !!import.meta.env.VITE_RAPIDAPI_KEY;

const AppContext = createContext(null);

const initialState = {
  resume: null,
  portals: { linkedin: false, indeed: false, glassdoor: false, ziprecruiter: false, dice: false, monster: false, simplyhired: false },
  dateRange: 'month',
  jobs: [],
  tailoredResumes: {},
  appliedJobs: [],
  loadingJobs: false,
  // Supabase session state
  userId: null,
  dbReady: false,       // true once initial DB load is complete
  dbError: null,        // non-null if DB init failed
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
        jobs: anyConnected ? state.jobs.filter((j) => j.portal !== action.payload) : [],
      };
    }
    case 'SET_JOBS':
      return { ...state, jobs: action.payload, loadingJobs: false };
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
  // Keep a ref for userId so callbacks don't stale-close over it
  const userIdRef = useRef(null);

  // ── Boot: create anonymous Supabase session and load persisted data ────────
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

        // Load all persisted data in parallel
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

  // ── Actions ───────────────────────────────────────────────────────────────

  const uploadResume = useCallback(async (file) => {
    // Show file immediately while parsing runs in background
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
          // Use the inferred role (e.g. "Senior Frontend Engineer") as the search term.
          // Fall back to inferring from skills text if role wasn't stored (e.g. loaded from DB).
          const searchQuery = state.resume?.searchQuery
            || state.resume?.role
            || inferJobRole(state.resume?.text || '')
            || 'Software Engineer';
          const liveJobs = await fetchJobsFromJSearch({ query: searchQuery, dateRange: state.dateRange });
          const tagged = liveJobs.map((j) => ({ ...j, portal }));
          const existingIds = new Set(state.jobs.map((j) => j.id));
          const merged = [...state.jobs, ...tagged.filter((j) => !existingIds.has(j.id))];
          dispatch({ type: 'SET_JOBS', payload: merged });
        } catch (err) {
          console.error('Live job fetch failed, using mock data:', err);
          loadMockJobs(portal);
        }
      } else {
        setTimeout(() => loadMockJobs(portal), 1200);
      }

      function loadMockJobs(p) {
        const existingIds = state.jobs.map((j) => j.id);
        const fresh = MOCK_JOBS.filter((j) => j.portal === p && !existingIds.includes(j.id));
        dispatch({ type: 'SET_JOBS', payload: [...state.jobs, ...fresh] });
      }
    },
    [state.jobs, state.resume]
  );

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

    const job = state.jobs.find((j) => j.id === jobId)
      ?? MOCK_JOBS.find((j) => j.id === jobId);

    if (job) await dbSaveAppliedJob({ userId, job });
  }, [state.jobs]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        uploadResume,
        connectPortal,
        disconnectPortal,
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
