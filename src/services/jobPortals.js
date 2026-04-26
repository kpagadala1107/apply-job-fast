// Job portal integrations
//
// Production options (ranked by ease of setup):
//   1. JSearch via RapidAPI   — aggregates LinkedIn + Indeed + Glassdoor (recommended)
//   2. Adzuna API             — free tier, broad coverage
//   3. LinkedIn OAuth         — profile auth only; job search needs enterprise partnership
//   4. Indeed Employer API    — job posting only, no search

const JSEARCH_HOST = 'jsearch.p.rapidapi.com';

// ─── JSearch (LinkedIn + Indeed + Glassdoor aggregator) ─────────────────────

const DATE_RANGE_MAP = {
  today: 'today',
  '3days': '3days',
  week: 'week',
  month: 'month',
  all: 'all',
};

export async function fetchJobsFromJSearch({ query, resumeSkills = [], location = '', page = 1, dateRange = 'month' }) {
  const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
  if (!apiKey) throw new Error('VITE_RAPIDAPI_KEY not set');

  const searchQuery = query || resumeSkills.slice(0, 3).join(' ') || 'software engineer';
  const params = new URLSearchParams({
    query: `${searchQuery}${location ? ` in ${location}` : ''}`,
    page: String(page),
    num_pages: '1',
    date_posted: DATE_RANGE_MAP[dateRange] || 'month',
  });

  const res = await fetch(`https://${JSEARCH_HOST}/search?${params}`, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': JSEARCH_HOST,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `JSearch API error ${res.status}`);
  }

  const data = await res.json();
  return (data.data || []).map(normalizeJSearchJob);
}

function normalizeJSearchJob(raw) {
  const description = buildDescription(raw);
  const tags = (raw.job_required_skills?.length ? raw.job_required_skills : extractTags(description)).slice(0, 6);

  return {
    id: raw.job_id,
    title: raw.job_title,
    company: raw.employer_name,
    companyData: {
      name: raw.employer_name,
      initial: (raw.employer_name?.[0] || '?').toUpperCase(),
      color: '#A78BFA',
      bg: 'rgba(139,92,246,0.12)',
    },
    location: raw.job_city
      ? `${raw.job_city}, ${raw.job_state || raw.job_country}`
      : raw.job_country || 'Remote',
    type: raw.job_employment_type || 'Full-time',
    workMode: raw.job_is_remote ? 'Remote' : raw.job_city ? 'Onsite' : 'Remote',
    portal: detectPortal(raw.job_publisher),
    salary: formatSalary(raw),
    matchScore: 0,
    postedDays: raw.job_posted_at_datetime_utc
      ? Math.max(0, Math.floor((Date.now() - new Date(raw.job_posted_at_datetime_utc)) / 86400000))
      : 0,
    tags,
    description,
    applyUrl: raw.job_apply_link,
    strengths: [],
    gaps: [],
  };
}

function detectPortal(publisher = '') {
  const p = publisher.toLowerCase();
  if (p.includes('linkedin')) return 'linkedin';
  if (p.includes('glassdoor')) return 'glassdoor';
  if (p.includes('ziprecruiter')) return 'ziprecruiter';
  if (p.includes('dice')) return 'dice';
  if (p.includes('monster')) return 'monster';
  if (p.includes('simplyhired')) return 'simplyhired';
  return 'indeed';
}

// Builds a clean, readable description from JSearch's various description fields.
// JSearch can return HTML in job_description, or structured highlights, or both.
function buildDescription(raw) {
  // Prefer the full description, but fall back to highlights
  const base = raw.job_description
    ? stripHtml(raw.job_description)
    : highlightsToText(raw.job_highlights);

  return base.trim() || 'No description available.';
}

// Strip HTML tags and decode common entities
function stripHtml(html = '') {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|li|ul|ol|h[1-6]|tr|td|th|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Convert JSearch's job_highlights object into readable text sections
function highlightsToText(highlights) {
  if (!highlights || typeof highlights !== 'object') return '';
  return Object.entries(highlights)
    .map(([section, items]) => {
      if (!Array.isArray(items) || !items.length) return '';
      return `${section}:\n${items.map((i) => `• ${i}`).join('\n')}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

function formatSalary(raw) {
  const { job_min_salary, job_max_salary, job_salary_period } = raw;
  if (!job_min_salary && !job_max_salary) return null;
  const fmt = (n) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
  const period = job_salary_period === 'YEAR' ? '/yr' : `/${(job_salary_period || 'yr').toLowerCase()}`;
  if (job_min_salary && job_max_salary)
    return `${fmt(job_min_salary)} – ${fmt(job_max_salary)}${period}`;
  return `${fmt(job_min_salary || job_max_salary)}${period}`;
}

function extractTags(description = '') {
  const tech = [
    'React', 'TypeScript', 'JavaScript', 'Python', 'Node.js', 'Next.js',
    'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST', 'SQL', 'PostgreSQL',
    'CSS', 'HTML', 'Vue', 'Angular', 'Go', 'Java', 'C++', 'Swift', 'Kotlin',
    'TensorFlow', 'PyTorch', 'Redis', 'MongoDB', 'CI/CD', 'Terraform',
  ];
  const lower = description.toLowerCase();
  return tech.filter((t) => lower.includes(t.toLowerCase()));
}

// ─── LinkedIn OAuth ──────────────────────────────────────────────────────────
// LinkedIn OAuth gives you user profile + connections — NOT job search.
// Job search via API requires LinkedIn Talent Solutions partner agreement.
// Use this to pre-fill user info from their LinkedIn profile.

export function buildLinkedInOAuthUrl() {
  const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
  if (!clientId) throw new Error('VITE_LINKEDIN_CLIENT_ID not set');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: `${window.location.origin}/auth/linkedin/callback`,
    scope: 'openid profile email',
    state: crypto.randomUUID(),
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}

export async function exchangeLinkedInCode(code) {
  // This exchange must happen server-side to keep client_secret safe.
  // In development, use a lightweight Express/Fastify proxy or Vite plugin.
  // Example backend endpoint: POST /api/auth/linkedin { code }
  const res = await fetch('/api/auth/linkedin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error('LinkedIn token exchange failed');
  return res.json(); // { access_token, profile: { name, email, picture } }
}

// ─── Adzuna API (alternative — free tier available) ─────────────────────────
// Register at: https://developer.adzuna.com
// Free: 250 calls/month

export async function fetchJobsFromAdzuna({ keywords = '', location = 'us', page = 1 }) {
  const appId = import.meta.env.VITE_ADZUNA_APP_ID;
  const appKey = import.meta.env.VITE_ADZUNA_APP_KEY;
  if (!appId || !appKey) throw new Error('VITE_ADZUNA_APP_ID / VITE_ADZUNA_APP_KEY not set');

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: '20',
    what: keywords,
    content_type: 'application/json',
  });

  const res = await fetch(
    `https://api.adzuna.com/v1/api/jobs/${location}/search/${page}?${params}`
  );
  if (!res.ok) throw new Error(`Adzuna API error ${res.status}`);
  const data = await res.json();

  return (data.results || []).map((raw) => ({
    id: raw.id,
    title: raw.title,
    company: raw.company?.display_name || 'Unknown',
    companyData: {
      name: raw.company?.display_name || 'Unknown',
      initial: raw.company?.display_name?.[0] || '?',
      color: '#60A5FA',
      bg: 'rgba(59,130,246,0.12)',
    },
    location: raw.location?.display_name || location,
    type: raw.contract_time === 'full_time' ? 'Full-time' : 'Part-time',
    workMode: raw.location?.display_name?.toLowerCase().includes('remote') ? 'Remote' : 'Onsite',
    portal: 'indeed',
    salary: raw.salary_min
      ? `$${Math.round(raw.salary_min / 1000)}k – $${Math.round(raw.salary_max / 1000)}k`
      : null,
    matchScore: 0,
    postedDays: raw.created
      ? Math.floor((Date.now() - new Date(raw.created)) / 86400000)
      : 0,
    tags: extractTags(raw.description),
    description: raw.description || '',
    applyUrl: raw.redirect_url,
    strengths: [],
    gaps: [],
  }));
}
