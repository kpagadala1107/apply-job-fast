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

const PREP_PLAN_PROMPT = `You are a senior technical recruiter and interview coach.
Given a job posting, create a comprehensive interview preparation plan.

Return this exact JSON (no markdown, no explanation):
{
  "roleOverview": "2–3 sentences on day-to-day responsibilities and what success looks like",
  "keyTopics": ["10–12 specific technical concepts or skills to master for this role"],
  "technicalQuestions": [
    {
      "question": "Technical interview question",
      "hint": "Key concepts, approach, and what interviewers are really assessing (2–3 sentences)",
      "difficulty": "easy|medium|hard",
      "category": "system design|coding|architecture|domain|debugging|language"
    }
  ],
  "scenarioQuestions": [
    {
      "question": "Behavioral question (Tell me about a time... / How would you handle...)",
      "starGuide": "STAR guidance: what Situation to highlight, what Action demonstrates the competency, what Result to emphasize",
      "competency": "competency being tested e.g. ownership, leadership, technical judgment, communication"
    }
  ],
  "companyQuestions": [
    {
      "question": "Company or role-fit question",
      "tip": "Key research direction or framing advice"
    }
  ],
  "resources": [
    {
      "title": "Exact resource name",
      "type": "documentation|course|book|video|practice|github|blog",
      "url": "Exact URL you are highly confident exists — no made-up URLs",
      "description": "Why this resource helps for this specific role",
      "priority": "must-read|recommended|bonus"
    }
  ],
  "studyPlan": {
    "week1": "Week 1: foundational review and resource setup",
    "week2": "Week 2: practice problems and deeper topic dives",
    "week3": "Week 3: system design, behavioral prep, company research",
    "dayBefore": "Day-before strategy: light review, mindset, logistics"
  }
}

Generate:
- 8–10 technical questions specific to the role, seniority, and job description keywords
- 5–7 behavioral scenario questions targeting key competencies for this level
- 3–5 company-fit questions tailored to this company
- 8–10 resources with real, verifiable URLs (LeetCode, GitHub, Coursera, official docs, YouTube, etc.)`;

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

// Called from PrepPlan page to generate a full interview preparation plan.
export async function generatePrepPlan(job) {
  const userContent = `Job Title: ${job.title}
Company: ${job.company}
Location: ${job.location || 'Not specified'}
Salary: ${job.salary || 'Not specified'}
Work Mode: ${job.workMode || 'Not specified'}
Tags: ${job.tags?.join(', ') || ''}

Job Description:
${(job.description || 'No description provided').slice(0, 3000)}`;

  if (!isLLMEnabled) return mockPrepPlan(job);

  try {
    const result = await llmJson(PREP_PLAN_PROMPT, userContent, 'gpt-4o');
    const mock = mockPrepPlan(job);
    return {
      roleOverview: result.roleOverview || mock.roleOverview,
      keyTopics: result.keyTopics?.length ? result.keyTopics : mock.keyTopics,
      technicalQuestions: result.technicalQuestions?.length ? result.technicalQuestions : mock.technicalQuestions,
      scenarioQuestions: result.scenarioQuestions?.length ? result.scenarioQuestions : mock.scenarioQuestions,
      companyQuestions: result.companyQuestions?.length ? result.companyQuestions : mock.companyQuestions,
      resources: result.resources?.length ? result.resources : mock.resources,
      studyPlan: result.studyPlan?.week1 ? result.studyPlan : mock.studyPlan,
    };
  } catch (err) {
    console.error('[LLM] Prep plan generation failed:', err.message);
    return mockPrepPlan(job);
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

function mockPrepPlan(job) {
  const title = job.title ?? 'Software Engineer';
  const company = job.company ?? 'the company';
  const tags = job.tags ?? ['JavaScript', 'React'];
  const isSenior = /senior|lead|staff|principal/i.test(title);

  return {
    roleOverview: `As a ${title} at ${company}, you will design, build, and maintain software systems that directly impact product and users. You will collaborate closely with product, design, and peer engineers to deliver features end-to-end. Success means writing clean, maintainable code, proactively identifying risks, and raising the bar for the entire team.`,
    keyTopics: [
      ...tags.slice(0, 4),
      'Data Structures & Algorithms',
      'System Design',
      'REST APIs & HTTP',
      isSenior ? 'Distributed Systems' : 'Design Patterns',
      'Testing Strategies',
      'Git & CI/CD',
      isSenior ? 'Technical Leadership & Mentoring' : 'Agile / Scrum',
      'Performance Optimization',
    ],
    technicalQuestions: [
      { question: `How would you design a scalable ${tags[0] ?? 'web'} application serving 10M+ users?`, hint: 'Cover load balancing, horizontal scaling, caching layers (Redis/CDN), database sharding, and async queues. Discuss CAP theorem trade-offs and consistency vs. availability.', difficulty: 'hard', category: 'system design' },
      { question: `What are the core performance pitfalls in ${tags[0] ?? 'modern web'} applications and how do you diagnose them?`, hint: 'Discuss profiling tools, N+1 queries, unnecessary re-renders (if frontend), memory leaks, blocking I/O. Show a systematic debug approach.', difficulty: 'medium', category: 'debugging' },
      { question: 'Implement a function to find the longest substring without repeating characters.', hint: 'Sliding window with a hash set. O(n) time, O(min(n,m)) space. Walk through edge cases: empty string, all same chars, Unicode.', difficulty: 'medium', category: 'coding' },
      { question: 'Design a rate limiter that allows 100 requests per minute per user.', hint: 'Compare token bucket vs. sliding window counter. Cover distributed state in Redis, clock skew, burst allowances, and client-facing headers.', difficulty: 'hard', category: 'system design' },
      { question: 'How do you approach reviewing a pull request from a junior engineer?', hint: 'Correctness first, then readability, then performance. Discuss tone (ask questions vs. demand changes), nitpick labeling, and focusing on principles not style.', difficulty: 'easy', category: 'domain' },
      { question: 'Explain the difference between optimistic and pessimistic locking. When would you use each?', hint: 'Optimistic: version check at commit (low contention). Pessimistic: lock before read (high contention). Discuss deadlock risks, retry logic, and distributed locking with Redis/ZooKeeper.', difficulty: 'medium', category: 'architecture' },
      { question: 'Walk through how you write a comprehensive test suite for a new feature.', hint: 'Test pyramid: unit → integration → E2E. What to mock vs. keep real (external APIs vs. internal modules). CI gates, coverage thresholds, flaky test prevention.', difficulty: 'easy', category: 'domain' },
      { question: 'How would you migrate a large relational database schema with zero downtime?', hint: 'Expand-contract pattern: add nullable column → backfill → add constraint → remove old column. Blue-green deploys, feature flags, rollback plan.', difficulty: 'hard', category: 'architecture' },
      { question: `Describe how ${tags[0] ?? 'your main technology'} handles concurrency and what pitfalls to watch for.`, hint: 'Cover the event loop (if JS), thread model, race conditions, atomic operations, and language-specific primitives (promises, goroutines, async/await).', difficulty: 'medium', category: 'language' },
    ],
    scenarioQuestions: [
      { question: 'Tell me about a time you had to deliver under significant time pressure. How did you manage?', starGuide: 'Situation: tight deadline + unclear scope. Action: scope negotiation, ruthless prioritization, daily standups, cut non-essentials. Result: shipped on time + planned follow-up iteration to address deferred work.', competency: 'execution under pressure' },
      { question: 'Describe a situation where you disagreed with a technical decision. What did you do?', starGuide: 'Situation: decision you believed was suboptimal (perf, security, maintainability). Action: data-driven proposal, got buy-in from stakeholders, proposed a time-boxed experiment. Result: outcome and what you learned regardless of decision.', competency: 'technical judgment & influence' },
      { question: 'Tell me about a time you identified and resolved a critical production incident.', starGuide: 'Situation: severity and user impact. Action: immediate triage, rollback decision, root cause analysis, hotfix. Result: time-to-resolution, post-mortem, and preventive measures you added.', competency: 'ownership & incident response' },
      { question: 'How have you helped onboard or mentor a less experienced engineer?', starGuide: 'Situation: new team member gaps. Action: structured onboarding doc, pair programming sessions, code review mentoring, weekly 1:1s. Result: their ramp time vs. average + what you improved for the next hire.', competency: 'mentorship & communication' },
      { question: 'Tell me about a project where requirements changed significantly mid-development.', starGuide: 'Situation: pivot or scope expansion. Action: impact assessment, stakeholder communication, re-scoping tradeoffs. Result: delivered adjusted scope + preserved relationship and trust.', competency: 'adaptability & stakeholder management' },
      { question: 'Describe a time you proactively improved something that was not part of your assigned work.', starGuide: 'Situation: pain point you noticed (slow CI, flaky tests, missing docs). Action: small proposal + scoped PR. Result: time saved or quality improved, measured and communicated to the team.', competency: 'ownership & initiative' },
    ],
    companyQuestions: [
      { question: `Why ${company} specifically — what excites you about this opportunity over others?`, tip: `Research ${company}'s recent product launches, engineering blog, and tech stack. Mention a specific technical decision or product feature that genuinely impressed you.` },
      { question: 'Where do you see yourself in 3 years, and how does this role fit that path?', tip: `Align growth goals with the role's scope. Show you've thought about career ladders and what progression looks like at ${company}.` },
      { question: 'What does your ideal engineering culture look like?', tip: `Research ${company}'s engineering values (check their blog/job posts). Touch on code review culture, deployment frequency, psychological safety, and how they handle incidents.` },
      { question: 'What questions do you have for us about the team and the role?', tip: 'Prepare 4–5 questions: team size, on-call rotation, biggest current technical challenge, how priorities are set, what success looks like in the first 90 days.' },
    ],
    resources: [
      { title: 'LeetCode — Algorithm Practice', type: 'practice', url: 'https://leetcode.com', description: 'Practice by topic and company tag. Start with "Top Interview 150" and focus on patterns over memorization.', priority: 'must-read' },
      { title: 'System Design Primer', type: 'github', url: 'https://github.com/donnemartin/system-design-primer', description: 'Comprehensive GitHub guide covering scalability, databases, caching, load balancing, and microservices.', priority: 'must-read' },
      { title: 'Tech Interview Handbook', type: 'blog', url: 'https://www.techinterviewhandbook.org', description: 'Free curated guide: algorithms cheat sheet, behavioral questions, resume tips, and offer negotiation.', priority: 'must-read' },
      { title: 'NeetCode — Structured Problem Roadmap', type: 'video', url: 'https://neetcode.io', description: 'Roadmap of LeetCode problems organized by pattern with clear video explanations. Great for visual learners.', priority: 'must-read' },
      { title: `Glassdoor — ${company} Interview Reports`, type: 'blog', url: `https://www.glassdoor.com/Interview/${company.replace(/\s+/g, '-')}-Interview-Questions-E.htm`, description: `Real interview experiences, difficulty ratings, and specific questions asked at ${company}.`, priority: 'must-read' },
      { title: 'Grokking System Design Interview — Educative', type: 'course', url: 'https://www.educative.io/courses/grokking-the-system-design-interview', description: 'Structured system design prep with real examples: URL shortener, Twitter, Netflix, and Uber.', priority: 'recommended' },
      { title: 'Cracking the Coding Interview — Gayle McDowell', type: 'book', url: 'https://www.amazon.com/Cracking-Coding-Interview-Programming-Questions/dp/0984782850', description: '189 interview problems with detailed solutions. Covers big-O, data structures, and common patterns.', priority: 'recommended' },
      { title: 'Blind — Anonymous Tech Career Community', type: 'blog', url: 'https://www.teamblind.com', description: `Anonymous discussions about ${company} interview process, compensation ranges, and team culture insights.`, priority: 'recommended' },
      { title: 'Big-O Cheat Sheet', type: 'blog', url: 'https://www.bigocheatsheet.com', description: 'Quick reference for time and space complexity of common algorithms and data structures.', priority: 'bonus' },
    ],
    studyPlan: {
      week1: `Audit your fundamentals: review ${tags.slice(0, 2).join(' and ')} core concepts, complete 15–20 easy/medium LeetCode problems (arrays, strings, hash maps), and read 3–5 Glassdoor interview reports for ${company}.`,
      week2: `Deep practice: solve 20+ medium problems (trees, graphs, dynamic programming). Run 2 full system design sessions (design Twitter, design a URL shortener). Review ${isSenior ? 'distributed systems patterns and technical leadership scenarios' : 'common design patterns and clean architecture principles'}.`,
      week3: `Mock interviews: 2–3 timed coding sessions with a timer, rehearse all 6 behavioral STAR stories out loud, read ${company}'s engineering blog and recent press releases. Prepare 5 smart questions for your interviewers.`,
      dayBefore: `Light review only — re-read your STAR stories and key topics list. Confirm logistics (time, format, interviewer names). Get 8 hours of sleep, eat well. Avoid grinding new problems. Arrive calm and early.`,
    },
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
