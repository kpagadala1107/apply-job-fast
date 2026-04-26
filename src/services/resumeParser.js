import { analyzeResumeWithLLM } from './openai';

// pdfjs and mammoth are dynamically imported so they are code-split into a
// separate chunk and only downloaded when the user actually uploads a file.

// ─── File parsers ─────────────────────────────────────────────────────────────

async function parsePdf(file) {
  const [{ getDocument, GlobalWorkerOptions }, pdfWorkerUrl] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl.default;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Reconstruct lines by grouping items with similar Y position
    const lineMap = new Map();
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y).push(item.str);
    }

    const lines = [...lineMap.entries()]
      .sort(([ya], [yb]) => yb - ya) // top to bottom
      .map(([, words]) => words.join(' ').trim())
      .filter(Boolean);

    pages.push(lines.join('\n'));
  }

  return pages.join('\n\n');
}

async function parseDocx(file) {
  const { default: mammoth } = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  if (result.messages.length) {
    console.warn('[resumeParser] mammoth warnings:', result.messages);
  }
  return result.value;
}

// ─── Text cleanup ─────────────────────────────────────────────────────────────

function normalizeText(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')      // collapse whitespace within lines
    .replace(/\n{3,}/g, '\n\n')   // max two consecutive blank lines
    .trim();
}

// ─── Skill extraction ─────────────────────────────────────────────────────────

const SKILLS_DB = [
  // Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'Bash', 'Shell', 'R', 'MATLAB',
  // Frontend
  'React', 'Vue', 'Angular', 'Next.js', 'Nuxt', 'Svelte', 'Remix', 'Gatsby',
  'Redux', 'Zustand', 'MobX', 'React Query', 'Tailwind', 'CSS', 'SCSS', 'HTML',
  'Framer Motion', 'D3.js', 'Three.js', 'WebGL', 'Canvas', 'Electron',
  // Backend
  'Node.js', 'Express', 'Fastify', 'NestJS', 'Django', 'Flask', 'FastAPI',
  'Spring', 'Rails', 'Laravel', 'ASP.NET',
  // APIs
  'GraphQL', 'REST', 'gRPC', 'WebSockets', 'tRPC',
  // Databases
  'PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Redis', 'Elasticsearch',
  'DynamoDB', 'Supabase', 'Firebase', 'Prisma',
  // AI / Data
  'OpenAI', 'LangChain', 'TensorFlow', 'PyTorch', 'scikit-learn',
  'Pandas', 'NumPy', 'Machine Learning', 'LLM', 'NLP', 'Hugging Face',
  // Cloud & DevOps
  'AWS', 'GCP', 'Azure', 'Vercel', 'Netlify', 'Docker', 'Kubernetes',
  'Terraform', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Linux',
  // Testing
  'Jest', 'Vitest', 'Cypress', 'Playwright', 'React Testing Library', 'Storybook',
  // Tools
  'Git', 'Webpack', 'Vite', 'Figma', 'Jira', 'Agile', 'Scrum',
  // Mobile
  'React Native', 'Flutter', 'iOS', 'Android',
];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractSkills(text) {
  const lower = text.toLowerCase();
  return SKILLS_DB.filter((skill) =>
    new RegExp(`\\b${escapeRegex(skill.toLowerCase())}\\b`).test(lower)
  );
}

// ─── Role inference ───────────────────────────────────────────────────────────

// Ordered from most specific to most generic. First match wins.
const ROLE_CATEGORIES = [
  { score: (s) => has(s, ['machine learning', 'ml engineer', 'deep learning', 'tensorflow', 'pytorch']), role: 'Machine Learning Engineer' },
  { score: (s) => has(s, ['data scientist', 'data science', 'scikit', 'pandas', 'numpy', 'statistics']), role: 'Data Scientist' },
  { score: (s) => has(s, ['data engineer', 'data pipeline', 'spark', 'airflow', 'kafka', 'dbt']), role: 'Data Engineer' },
  { score: (s) => has(s, ['devops', 'site reliability', 'sre', 'platform engineer', 'infrastructure']), role: 'DevOps Engineer' },
  { score: (s) => has(s, ['react native', 'flutter', 'mobile developer', 'ios developer', 'android developer', 'swift', 'kotlin']), role: 'Mobile Developer' },
  { score: (s) => has(s, ['ui/ux', 'ux engineer', 'design engineer', 'product designer']), role: 'Design Engineer' },
  { score: (s) => has(s, ['full stack', 'fullstack', 'full-stack']), role: 'Full Stack Engineer' },
  { score: (s) => has(s, ['frontend', 'front-end', 'front end', 'ui engineer', 'ui developer', 'react developer', 'vue developer', 'angular developer']), role: 'Frontend Engineer' },
  { score: (s) => has(s, ['backend', 'back-end', 'back end', 'api engineer', 'server-side', 'node developer', 'python developer']), role: 'Backend Engineer' },
  { score: (s) => has(s, ['cloud engineer', 'cloud architect', 'aws engineer', 'solutions architect']), role: 'Cloud Engineer' },
  { score: (s) => has(s, ['security engineer', 'cybersecurity', 'appsec', 'devsecops']), role: 'Security Engineer' },
  { score: (s) => has(s, ['software engineer', 'software developer', 'swe', 'programmer']), role: 'Software Engineer' },
];

const SENIORITY = [
  { keywords: ['staff engineer', 'staff software'], prefix: 'Staff' },
  { keywords: ['principal engineer', 'principal software'], prefix: 'Principal' },
  { keywords: ['lead engineer', 'tech lead', 'technical lead', 'engineering lead'], prefix: 'Lead' },
  { keywords: ['senior engineer', 'senior developer', 'senior software', 'sr. ', 'sr engineer', 'sr developer'], prefix: 'Senior' },
];

function has(text, keywords) {
  return keywords.some((k) => text.includes(k));
}

// Tries to extract the job title directly from the resume header (lines 1–6).
// Most resumes follow: Name → Title → Contact → Summary
function extractTitleFromHeader(text) {
  const CONTACT_SIGNALS = ['@', 'http', 'linkedin', 'github', 'phone', 'tel:', '+1', '(', 'street', 'avenue', 'remote'];
  const TITLE_WORDS = /engineer|developer|architect|scientist|analyst|designer|manager|lead|director|specialist|consultant|programmer|devops|sre|cto|vp of/i;

  const lines = text.split('\n').slice(0, 8).map((l) => l.trim()).filter(Boolean);

  for (const line of lines.slice(1)) { // skip the name (first line)
    const lower = line.toLowerCase();
    if (CONTACT_SIGNALS.some((s) => lower.includes(s))) continue;
    if (line.split(/\s+/).length > 7) continue; // too long to be a title
    if (TITLE_WORDS.test(line)) return line;
  }
  return null;
}

// Infer the best job search query from parsed resume text.
// Returns a short, JSearch-friendly role string like "Senior Frontend Engineer".
export function inferJobRole(text) {
  if (!text) return 'Software Engineer';

  // 1. Try the resume header first — highest signal
  const headerTitle = extractTitleFromHeader(text);
  if (headerTitle) return headerTitle;

  // 2. Score the full text against role categories
  const lower = text.toLowerCase();
  const matched = ROLE_CATEGORIES.find(({ score }) => score(lower));
  const baseRole = matched?.role ?? 'Software Engineer';

  // 3. Detect seniority modifier
  const seniority = SENIORITY.find(({ keywords }) => keywords.some((k) => lower.includes(k)));
  return seniority ? `${seniority.prefix} ${baseRole}` : baseRole;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function parseResume(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  let rawText;
  if (ext === 'pdf') {
    rawText = await parsePdf(file);
  } else if (ext === 'docx') {
    rawText = await parseDocx(file);
  } else if (ext === 'doc') {
    try { rawText = await parseDocx(file); }
    catch { throw new Error('.doc format not supported — convert to PDF or DOCX'); }
  } else {
    throw new Error(`Unsupported file type: .${ext}`);
  }

  const text = normalizeText(rawText);

  const llm = await analyzeResumeWithLLM(text).catch(() => null);
  const skills = llm?.skills?.length ? llm.skills : extractSkills(text);
  const role = llm?.role ?? inferJobRole(text);
  const searchQuery = llm?.searchQuery ?? role;
  const seniority = llm?.seniority ?? null;

  return { text, skills, role, searchQuery, seniority };
}
