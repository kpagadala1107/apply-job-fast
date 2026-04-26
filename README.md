# ApplyFast — AI Job Assistant

AI-powered web app to match your resume against job listings, tailor it per application, and track everything in one place.

---

## Quick Start

```bash
cp .env.example .env   # fill in your keys (see Configuration)
npm install
npm run dev            # http://localhost:5173
```

---

## Architecture

```
apply-jobs-fast/
│
├── src/
│   ├── main.jsx                 Entry point — mounts React + global CSS
│   ├── App.jsx                  Router — wires pages to URL routes
│   ├── index.css                Design system (CSS variables, buttons, cards, animations)
│   │
│   ├── context/
│   │   └── AppContext.jsx       Global state (resume, jobs, tailored resumes, applied jobs)
│   │                            Boots Supabase session on load; persists all writes to DB
│   │
│   ├── pages/
│   │   ├── Landing.jsx          Home — resume upload + portal connect + how-it-works
│   │   ├── JobSearch.jsx        Job list — search, filter, sort by match score
│   │   ├── ResumeTailor.jsx     Per-job AI tailoring — editor, analysis, preview, download
│   │   └── Dashboard.jsx        Overview — stats, tailored resumes, applied jobs
│   │
│   ├── components/
│   │   ├── Layout.jsx           App shell — fixed sidebar + sticky header + page outlet
│   │   ├── ResumeUpload.jsx     Drag-and-drop upload (PDF/DOC/DOCX), file validation
│   │   ├── PortalConnect.jsx    LinkedIn / Indeed connection cards with mock OAuth
│   │   ├── JobCard.jsx          Job listing card (grid or list view) with match ring
│   │   ├── MatchRing.jsx        Animated SVG circular progress — colour-coded match %
│   │   └── Modal.jsx            Generic overlay modal (resume preview)
│   │
│   ├── services/
│   │   ├── supabase.js          Supabase client, anonymous auth, Storage file upload
│   │   ├── db.js                All DB operations — save/load resume, tailored, applied
│   │   ├── openai.js            GPT-4o resume analysis + tailoring (mock by default)
│   │   └── jobPortals.js        JSearch (LinkedIn+Indeed), Adzuna, LinkedIn OAuth helpers
│   │
│   └── data/
│       └── mockData.js          12 realistic mock jobs, sample resume text, helper fns
│
├── supabase/
│   └── schema.sql               DB tables, RLS policies, Storage bucket, indexes
│
├── .env.example                 All required env vars with signup links
└── .env                         Your actual keys (gitignored — never commit this)
```

---

## Data Flow

```
User uploads resume
  └─► ResumeUpload → AppContext.uploadResume()
        ├─ Dispatches to local state immediately (optimistic UI)
        └─ Uploads file to Supabase Storage + saves metadata to resumes table

User connects LinkedIn / Indeed
  └─► PortalConnect → AppContext.connectPortal()
        ├─ If VITE_RAPIDAPI_KEY set: fetches real jobs from JSearch API
        └─ Otherwise: loads mock jobs from mockData.js

User opens a job → Tailor Resume page
  └─► ResumeTailor
        ├─ Calls openai.analyzeResumeMatch() → strengths, gaps, suggestions
        ├─ Calls openai.generateTailoredResume() → full tailored resume object
        ├─ User edits in textarea → preview in Modal → download as .txt
        └─ AppContext.saveTailoredResume() → saves to tailored_resumes table

User clicks Apply
  └─► AppContext.markApplied() → saves to applied_jobs table
        └─ Opens job portal URL in new tab (LinkedIn / Indeed direct link)

App boot (every visit)
  └─► AppContext useEffect
        ├─ getOrCreateSession() → Supabase anonymous auth (stable across visits)
        └─ Loads resume + tailored resumes + applied jobs from DB in parallel
```

---

## Pages & Routes

| Route | Page | What it does |
|---|---|---|
| `/` | Landing | Upload resume, connect portals, see how-it-works |
| `/jobs` | Job Search | Browse matched jobs with score, filter by mode/portal |
| `/tailor/:jobId` | Resume Tailor | AI analysis, generate tailored resume, preview, apply |
| `/dashboard` | Dashboard | Stats + all tailored and applied jobs in one view |

---

## Configuration

Copy `.env.example` to `.env` and fill in the keys you need:

| Variable | Required | Where to get it |
|---|---|---|
| `VITE_SUPABASE_URL` | For persistence | supabase.com → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | For persistence | supabase.com → Settings → API |
| `VITE_RAPIDAPI_KEY` | For real jobs | rapidapi.com → JSearch API |
| `VITE_OPENAI_API_KEY` | For live AI | platform.openai.com |
| `VITE_LINKEDIN_CLIENT_ID` | For LinkedIn login | linkedin.com/developers |

Everything gracefully falls back to mock data if keys are absent — the app works fully offline.

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. SQL Editor → paste and run `supabase/schema.sql`
3. Authentication → Providers → **Anonymous** → Enable
4. Copy Project URL + anon key into `.env`

Tables created: `resumes` · `tailored_resumes` · `applied_jobs`
Storage bucket created: `resumes` (private, RLS-protected)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | React Router v6 |
| State | useReducer + Context API |
| Database | Supabase (Postgres + Storage) |
| Auth | Supabase Anonymous Auth |
| Icons | Lucide React |
| AI | OpenAI GPT-4o (via `openai` SDK) |
| Jobs API | JSearch via RapidAPI |
| Styling | Custom CSS (no framework) |
