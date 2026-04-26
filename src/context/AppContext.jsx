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
  // Job search parameters — user-editable
  searchQuery: '',
  searchLocation: '',
  dateRange: 'month',
  // Job results
  jobs: [],
  loadingJobs: false,
  jobsError: null,
  lastFetched: null,
  jobsFetchedLive: false,
  // Application tracking
  tailoredResumes: {},
  appliedJobs: [],
  // Supabase
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
    case 'SET_SEARCH_PARAMS':
      return { ...state, searchQuery: action.payload.query, searchLocation: action.payload.location, dateRange: action.payload.dateRange };
    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload };
    case 'SET_LOADING':
      return { ...state, loadingJobs: action.payload, jobsError: null };
    case 'SET_JOBS':
      return {
        ...state,
        jobs: action.payload.jobs,
        loadingJobs: false,
        jobsError: null,
        lastFetched: action.payload.live ? new Date().toISOString() : state.lastFetched,
        jobsFetchedLive: action.payload.live ?? state.jobsFetchedLive,
      };
    case 'SET_JOBS_ERROR':
      return { ...state, loadingJobs: false, jobsError: action.payload };
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
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const userIdRef = useRef(null);
  const fetchPageRef = useRef(0);

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
        if (cancelled || !userId) { dispatch({ type: 'DB_ERROR', payload: 'Could not create session' }); return; }
        userIdRef.current = userId;
        dispatch({ type: 'SET_USER_ID', payload: userId });
        const [resume, tailoredResumes, appliedJobs] = await Promise.all([
          dbLoadResume(userId), dbLoadTailoredResumes(userId), dbLoadAppliedJobs(userId),
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
    dispatch({
      type: 'UPLOAD_RESUME',
      payload: { name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString(), text: '', skills: [], parsing: true },
    });
    let text = '', skills = [], role = 'Software Engineer';
    try { ({ text, skills, role } = await parseResume(file)); } catch (err) { console.error('[uploadResume]', err.message); }
    const parsed = { name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString(), text, skills, role, parsing: false };
    dispatch({ type: 'UPLOAD_RESUME', payload: parsed });
    const userId = userIdRef.current;
    if (!userId) return;
    const storagePath = await uploadResumeFile(userId, file);
    await dbSaveResume({ userId, name: file.name, size: file.size, type: file.type, text, storagePath });
  }, []);

  // Primary search action — called from Landing and JobSearch
  const searchJobs = useCallback(async ({ query, location = '', dateRange = 'month' } = {}) => {
    const effectiveQuery = query || state.resume?.role || inferJobRole(state.resume?.text || '') || 'Software Engineer';
    dispatch({ type: 'SET_SEARCH_PARAMS', payload: { query: effectiveQuery, location, dateRange } });
    dispatch({ type: 'SET_LOADING', payload: true });

    if (USE_LIVE_API) {
      try {
        fetchPageRef.current += 1;
        const jobs = await fetchJobsFromJSearch({ query: effectiveQuery, location, dateRange, page: fetchPageRef.current });
        dispatch({ type: 'SET_JOBS', payload: { jobs, live: true } });
      } catch (err) {
        console.error('[searchJobs] Live fetch failed, using mock data:', err.message);
        dispatch({ type: 'SET_JOBS', payload: { jobs: MOCK_JOBS, live: false } });
        dispatch({ type: 'SET_JOBS_ERROR', payload: err.message });
      }
    } else {
      setTimeout(() => {
        dispatch({ type: 'SET_JOBS', payload: { jobs: MOCK_JOBS, live: false } });
      }, 900);
    }
  }, [state.resume]);

  // Re-fetch with new page offset to get fresh results
  const refreshJobs = useCallback(async () => {
    if (!USE_LIVE_API) return;
    await searchJobs({ query: state.searchQuery, location: state.searchLocation, dateRange: state.dateRange });
  }, [searchJobs, state.searchQuery, state.searchLocation, state.dateRange]);

  const setDateRange = useCallback((range) => {
    dispatch({ type: 'SET_DATE_RANGE', payload: range });
  }, []);

  const saveTailoredResume = useCallback(async (jobId, data) => {
    dispatch({ type: 'SAVE_TAILORED_RESUME', payload: { jobId, data } });
    const userId = userIdRef.current;
    if (userId) await dbSaveTailoredResume({ userId, jobId, content: data });
  }, []);

  const markApplied = useCallback(async (jobId) => {
    dispatch({ type: 'MARK_APPLIED', payload: jobId });
    const userId = userIdRef.current;
    if (!userId) return;
    const job = state.jobs.find((j) => j.id === jobId) ?? MOCK_JOBS.find((j) => j.id === jobId);
    if (job) await dbSaveAppliedJob({ userId, job });
  }, [state.jobs]);

  return (
    <AppContext.Provider value={{
      ...state,
      isLive: USE_LIVE_API,
      searchJobs,
      refreshJobs,
      setDateRange,
      uploadResume,
      saveTailoredResume,
      markApplied,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
