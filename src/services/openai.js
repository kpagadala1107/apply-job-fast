import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
export const isLLMEnabled = !!apiKey;

// Lazy client — only instantiated when API key is present
let _client = null;
function getClient() {
  if (!_client && apiKey) {
    _client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }
  return _client;
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const RESUME_ANALYSIS_PROMPT = `You are a resume parser and career advisor.
Analyze the resume and return a JSON object with exactly these fields:
{
  "role": "The person's current or most recent job title as written on the resume",
  "seniority": "One of: junior | mid | senior | staff | principal | lead",
  "yearsExperience": <integer, estimated total years>,
  "skills": ["8–12 most relevant technical skills, strongest first"],
  "searchQuery": "A 2–4 word job title ideal for searching LinkedIn/Indeed. Must be a job title, NOT a list of skills. Examples: 'Senior React Engineer', 'ML Engineer Python', 'Full Stack TypeScript Developer'",
  "summary": "One sentence professional summary"
}
Return valid JSON only. No markdown, no explanation.`;

const MATCH_ANALYSIS_PROMPT = `You are a job application specialist.
Given a resume and a job description, analyze the match and return this JSON:
{
  "score": <integer 0–100, realistic match percentage based on actual overlap>,
  "strengths": ["3–6 specific requirements from the job that the resume clearly meets"],
  "gaps": ["1–4 specific requirements mentioned in the job that are missing or weak in the resume"],
  "suggestions": ["3–4 concrete, specific actions to improve this resume for this exact role"]
}
Be honest and precise — score should reflect real skill overlap, not optimism.
Return valid JSON only.`;

const TAILOR_RESUME_PROMPT = `You are an expert resume writer and ATS optimization specialist.
Rewrite the provided resume to maximize its relevance for the target job.

Rules:
- Never fabricate experience, skills, or credentials not in the original
- Reorder and rephrase bullet points to lead with the most job-relevant achievements
- Mirror exact keywords and terminology from the job description
- Quantify achievements where the original is vague but context supports it
- Keep the same factual structure — only rewrite framing and ordering

Return this exact JSON structure (no other text):
{
  "name": "full name from resume",
  "contact": "contact line from resume",
  "summary": "rewritten 2-sentence summary tailored to the job",
  "experience": [
    {
      "role": "job title",
      "company": "company name",
      "period": "date range",
      "bullets": ["rewritten bullet 1", "rewritten bullet 2", "..."]
    }
  ],
  "skills": {
    "highlighted": ["top 6 skills most relevant to this specific job"],
    "languages": ["programming languages"],
    "frameworks": ["frameworks and libraries"],
    "tools": ["tools, platforms, cloud"],
    "testing": ["testing tools"]
  },
  "education": "degree | institution | year",
  "projects": [{ "name": "project name", "description": "one-line description" }],
  "tailoredFor": "<job title> at <company>",
  "estimatedScore": <integer, expected match % after tailoring, typically 85–97>
}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function llmJson(systemPrompt, userContent, model = 'gpt-4o-mini') {
  const client = getClient();
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });
  return JSON.parse(response.choices[0].message.content);
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Public API ───────────────────────────────────────────────────────────────

// Called from resumeParser after text extraction.
// Returns { role, seniority, yearsExperience, skills, searchQuery, summary }
// or null if LLM is not configured.
export async function analyzeResumeWithLLM(resumeText) {
  if (!isLLMEnabled) return null;
  try {
    return await llmJson(
      RESUME_ANALYSIS_PROMPT,
      `Resume:\n\n${resumeText.slice(0, 4000)}`,  // cap to stay within context
    );
  } catch (err) {
    console.error('[LLM] Resume analysis failed:', err.message);
    return null;
  }
}

// Called from ResumeTailor to score resume vs job.
export async function analyzeResumeMatch(resumeText, job) {
  if (!isLLMEnabled) return mockMatch(job);

  try {
    const result = await llmJson(
      MATCH_ANALYSIS_PROMPT,
      `Resume:\n${resumeText.slice(0, 3000)}\n\nJob Title: ${job.title}\nCompany: ${job.company}\nDescription:\n${job.description.slice(0, 2500)}`,
    );
    // Normalise shape in case model returns slightly different keys
    return {
      score: result.score ?? result.matchScore ?? job.matchScore,
      strengths: result.strengths ?? [],
      gaps: result.gaps ?? [],
      suggestions: result.suggestions ?? [],
    };
  } catch (err) {
    console.error('[LLM] Match analysis failed:', err.message);
    return mockMatch(job);
  }
}

// Called from ResumeTailor to generate a tailored resume.
export async function generateTailoredResume(resumeText, job) {
  if (!isLLMEnabled) return mockTailoredResume(job);

  try {
    // Use gpt-4o for quality on the full rewrite task
    const result = await llmJson(
      TAILOR_RESUME_PROMPT,
      `Original Resume:\n${resumeText.slice(0, 3500)}\n\nTarget Job:\nTitle: ${job.title}\nCompany: ${job.company}\nDescription:\n${job.description.slice(0, 2500)}`,
      'gpt-4o',
    );
    // Ensure required fields exist so the rest of the app doesn't break
    return {
      name: result.name ?? '',
      contact: result.contact ?? '',
      summary: result.summary ?? '',
      experience: Array.isArray(result.experience) ? result.experience : [],
      skills: result.skills ?? { highlighted: [], languages: [], frameworks: [], tools: [], testing: [] },
      education: result.education ?? '',
      projects: Array.isArray(result.projects) ? result.projects : [],
      tailoredFor: result.tailoredFor ?? `${job.title} at ${job.company}`,
      estimatedScore: result.estimatedScore ?? Math.min(job.matchScore + 8, 97),
    };
  } catch (err) {
    console.error('[LLM] Resume tailoring failed:', err.message);
    return mockTailoredResume(job);
  }
}

export function formatTailoredResumeAsText(tailored) {
  const { name, contact, summary, experience, skills, education, projects } = tailored;

  const expText = (experience || [])
    .map((e) => `${e.role} | ${e.company} | ${e.period}\n${e.bullets.map((b) => `• ${b}`).join('\n')}`)
    .join('\n\n');

  const skillsText = [
    skills.languages?.length ? `Languages: ${skills.languages.join(', ')}` : '',
    skills.frameworks?.length ? `Frameworks: ${skills.frameworks.join(', ')}` : '',
    skills.tools?.length ? `Tools: ${skills.tools.join(', ')}` : '',
    skills.testing?.length ? `Testing: ${skills.testing.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  const projectsText = (projects || []).map((p) => `${p.name} — ${p.description}`).join('\n');

  return [name, contact, '', 'SUMMARY', summary, '', 'EXPERIENCE', expText, '', 'SKILLS', skillsText, '', 'EDUCATION', education, '', 'PROJECTS', projectsText].join('\n');
}

// ─── Mock fallbacks (used when VITE_OPENAI_API_KEY is not set) ────────────────

function mockMatch(job) {
  return {
    score: job.matchScore ?? 75,
    strengths: job.strengths ?? [],
    gaps: job.gaps ?? [],
    suggestions: [
      `Tailor your summary to highlight experience relevant to ${job.company}'s domain`,
      `Quantify your impact with metrics — numbers stand out to ${job.title} hiring managers`,
      job.gaps?.length ? `Address the "${job.gaps[0]}" gap with adjacent transferable experience` : 'Your profile is a strong match for this role',
      'Mirror the exact keywords from the job description to pass ATS screening',
    ],
  };
}

function mockTailoredResume(job) {
  const tags = job.tags ?? [];
  return {
    name: 'Your Name',
    contact: 'your.email@email.com | github.com/yourhandle',
    summary: `Results-driven engineer with proven experience building ${tags.slice(0, 2).join(' and ')} applications. Passionate about delivering high-quality software that drives measurable impact at ${job.company}-scale.`,
    experience: [
      {
        role: 'Senior Software Engineer',
        company: 'Previous Company',
        period: '2022 – Present',
        bullets: [
          `Led development of key product features using ${tags[0] ?? 'modern frameworks'} — reduced load time by 40%`,
          'Mentored junior engineers and established code review best practices',
          'Collaborated cross-functionally with product and design to ship 8 major features',
        ],
      },
    ],
    skills: {
      highlighted: tags.slice(0, 6),
      languages: ['TypeScript', 'JavaScript', 'Python'],
      frameworks: ['React', 'Node.js', tags[0] ?? 'Express'].slice(0, 4),
      tools: ['Git', 'Docker', 'AWS', 'CI/CD'],
      testing: ['Jest', 'React Testing Library'],
    },
    education: 'B.S. Computer Science | University | Year',
    projects: [{ name: 'Personal Project', description: `A project demonstrating ${tags[0] ?? 'software engineering'} skills` }],
    tailoredFor: `${job.title} at ${job.company}`,
    estimatedScore: Math.min((job.matchScore ?? 75) + 8, 97),
  };
}
