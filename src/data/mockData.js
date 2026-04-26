export const SAMPLE_RESUME_TEXT = `Alex Rivera
Senior Frontend Engineer
alex.rivera@email.com | github.com/alexrivera | linkedin.com/in/alexrivera | San Francisco, CA

SUMMARY
Frontend-focused software engineer with 6 years of experience building high-performance React applications at scale. Specialized in TypeScript, state management, and performance optimization. Comfortable leading frontend architecture decisions and mentoring junior engineers.

EXPERIENCE

Senior Frontend Engineer | TechFlow Inc. | Jan 2022 – Present
• Led rebuild of core product dashboard using React 18, TypeScript, and Zustand — reduced load time by 55%
• Designed and implemented shared component library adopted across 4 product teams
• Mentored 3 junior engineers, conducting code reviews and pair programming sessions
• Integrated OpenAI API for AI-assisted features; improved user engagement by 30%
• Collaborated with product and design to ship 12 major features in 18 months

Frontend Developer | NovaSpark | Jun 2019 – Dec 2021
• Built complex data visualization dashboards using React, D3.js, and Recharts
• Implemented GraphQL client with Apollo and Redux Toolkit for state management
• Developed CI/CD pipelines with GitHub Actions; reduced deployment time by 40%
• Created reusable hooks library for common patterns used across the codebase

TECHNICAL SKILLS
Languages: TypeScript, JavaScript (ES2022+), HTML5, CSS3, Python
Frameworks & Libraries: React 18, Next.js 14, Node.js, Express, Tailwind CSS, Framer Motion
State Management: Redux Toolkit, Zustand, React Query, Context API
Tools & Platforms: Git, Webpack, Vite, Docker, AWS (S3, Lambda, CloudFront), Vercel
Testing: Jest, React Testing Library, Cypress, Playwright
APIs & Data: REST, GraphQL, WebSockets, OpenAI API, Stripe

EDUCATION
B.S. Computer Science | UC Berkeley | 2019

PROJECTS
• OpenDash — Open source React dashboard kit with 1.2k GitHub stars
• ResumeAI — Personal project using OpenAI to help optimize resumes`;

const companies = {
  vercel: { name: 'Vercel', color: '#000000', bg: '#FFFFFF', initial: 'V' },
  stripe: { name: 'Stripe', color: '#635BFF', bg: 'rgba(99,91,255,0.15)', initial: 'S' },
  figma: { name: 'Figma', color: '#F24E1E', bg: 'rgba(242,78,30,0.15)', initial: 'F' },
  linear: { name: 'Linear', color: '#5E6AD2', bg: 'rgba(94,106,210,0.15)', initial: 'L' },
  shopify: { name: 'Shopify', color: '#96BF48', bg: 'rgba(150,191,72,0.15)', initial: 'S' },
  airbnb: { name: 'Airbnb', color: '#FF5A5F', bg: 'rgba(255,90,95,0.15)', initial: 'A' },
  notion: { name: 'Notion', color: '#FFFFFF', bg: 'rgba(255,255,255,0.1)', initial: 'N' },
  github: { name: 'GitHub', color: '#FFFFFF', bg: 'rgba(255,255,255,0.1)', initial: 'G' },
  atlassian: { name: 'Atlassian', color: '#0052CC', bg: 'rgba(0,82,204,0.15)', initial: 'A' },
  discord: { name: 'Discord', color: '#5865F2', bg: 'rgba(88,101,242,0.15)', initial: 'D' },
  openai: { name: 'OpenAI', color: '#FFFFFF', bg: 'rgba(255,255,255,0.08)', initial: 'O' },
  supabase: { name: 'Supabase', color: '#3ECF8E', bg: 'rgba(62,207,142,0.15)', initial: 'S' },
};

export const MOCK_JOBS = [
  {
    id: 'job-1',
    title: 'Senior Frontend Engineer',
    company: 'Vercel',
    companyData: companies.vercel,
    location: 'Remote',
    type: 'Full-time',
    workMode: 'Remote',
    portal: 'linkedin',
    salary: '$160,000 – $200,000',
    matchScore: 92,
    postedDays: 1,
    tags: ['React', 'TypeScript', 'Next.js', 'Performance'],
    description: `We're looking for a Senior Frontend Engineer to join Vercel's product team. You'll work on the Vercel dashboard, building features that help millions of developers deploy and manage their applications.

What you'll do:
• Build and maintain the Vercel dashboard using Next.js and TypeScript
• Collaborate with design and product to ship polished, high-performance UIs
• Optimize Core Web Vitals across the platform
• Mentor engineers and contribute to frontend best practices

Requirements:
• 5+ years of frontend engineering experience
• Expert-level React and TypeScript knowledge
• Deep understanding of Next.js and the React ecosystem
• Experience with performance profiling and optimization
• Familiarity with CI/CD, testing (Jest, Playwright), and web standards
• Strong CSS and design system experience

Nice to have:
• Experience with edge computing or serverless platforms
• Open source contributions
• Experience with Turborepo or monorepo setups`,
    strengths: ['React expertise', 'TypeScript', 'Next.js', 'Performance optimization', 'CI/CD', 'Testing'],
    gaps: ['Edge computing', 'Turborepo'],
  },
  {
    id: 'job-2',
    title: 'Product Engineer – Design Tools',
    company: 'Figma',
    companyData: companies.figma,
    location: 'San Francisco, CA',
    type: 'Full-time',
    workMode: 'Hybrid',
    portal: 'linkedin',
    salary: '$155,000 – $195,000',
    matchScore: 87,
    postedDays: 2,
    tags: ['React', 'TypeScript', 'Canvas', 'WebGL'],
    description: `Figma is looking for a Product Engineer to help build the future of design tooling. You'll work on features used by millions of designers and developers every day.

What you'll do:
• Build features across Figma's web and desktop applications
• Work on performance-critical rendering systems
• Collaborate directly with designers to implement pixel-perfect experiences
• Drive technical decisions and contribute to engineering culture

Requirements:
• 4+ years of product engineering experience
• Strong React and TypeScript skills
• Experience building complex, interactive UIs
• Attention to detail and passion for great design
• Familiarity with performance optimization techniques

Nice to have:
• Experience with Canvas API or WebGL
• Background in design tools or creative applications
• Knowledge of WASM or Rust`,
    strengths: ['React', 'TypeScript', 'UI/UX focus', 'Performance', 'Component libraries'],
    gaps: ['Canvas API', 'WebGL', 'WASM'],
  },
  {
    id: 'job-3',
    title: 'Software Engineer – Frontend Platform',
    company: 'Stripe',
    companyData: companies.stripe,
    location: 'Remote',
    type: 'Full-time',
    workMode: 'Remote',
    portal: 'indeed',
    salary: '$170,000 – $220,000',
    matchScore: 84,
    postedDays: 3,
    tags: ['React', 'TypeScript', 'Design Systems', 'Accessibility'],
    description: `Stripe's Frontend Platform team builds the tools, infrastructure, and design systems that enable hundreds of engineers to ship high-quality products.

What you'll do:
• Build and evolve Stripe's design system and component library
• Develop internal tooling for frontend developers
• Champion accessibility and performance standards
• Create documentation and developer experience improvements

Requirements:
• 4+ years of frontend engineering experience
• Strong React, TypeScript, and CSS knowledge
• Experience building or maintaining a design system
• Deep commitment to accessibility (WCAG standards)
• Excellent written communication skills

Nice to have:
• Experience with Storybook or similar tools
• Background in developer experience or devtools
• Knowledge of i18n/l10n`,
    strengths: ['React', 'TypeScript', 'Component library experience', 'Documentation'],
    gaps: ['Accessibility deep expertise', 'Storybook', 'i18n'],
  },
  {
    id: 'job-4',
    title: 'Frontend Engineer',
    company: 'Linear',
    companyData: companies.linear,
    location: 'Remote',
    type: 'Full-time',
    workMode: 'Remote',
    portal: 'indeed',
    salary: '$150,000 – $185,000',
    matchScore: 89,
    postedDays: 2,
    tags: ['React', 'TypeScript', 'Electron', 'GraphQL'],
    description: `Linear is building the future of software project management. We're looking for engineers who care deeply about product quality and developer experience.

What you'll do:
• Work on Linear's web and desktop applications (React + Electron)
• Build real-time collaborative features with WebSockets
• Implement complex data models and UI interactions
• Own features from design to deployment

Requirements:
• 3+ years of experience with React and TypeScript
• Experience with complex state management
• Understanding of real-time systems and collaborative UIs
• Strong problem-solving skills and product instincts
• GraphQL experience

Nice to have:
• Electron or native app experience
• Experience with OT or CRDT algorithms
• Strong visual design sensibility`,
    strengths: ['React', 'TypeScript', 'State management', 'GraphQL', 'Product instincts'],
    gaps: ['Electron', 'CRDT/OT algorithms'],
  },
  {
    id: 'job-5',
    title: 'Frontend Engineer – Commerce',
    company: 'Shopify',
    companyData: companies.shopify,
    location: 'Remote',
    type: 'Full-time',
    workMode: 'Remote',
    portal: 'linkedin',
    salary: '$140,000 – $180,000',
    matchScore: 76,
    postedDays: 5,
    tags: ['React', 'TypeScript', 'GraphQL', 'Ruby on Rails'],
    description: `Join Shopify's Commerce team to help merchants around the world run their businesses. You'll build merchant-facing tools that power millions of online stores.

What you'll do:
• Build and improve merchant dashboard features
• Work with GraphQL APIs and React frontend
• Collaborate with cross-functional teams across design, product, and backend
• Contribute to Shopify's open-source ecosystem (Polaris design system)

Requirements:
• 3+ years of experience with React
• TypeScript and GraphQL proficiency
• Experience with Ruby on Rails or willingness to learn
• Strong understanding of web performance
• Collaborative and remote-first mindset`,
    strengths: ['React', 'TypeScript', 'GraphQL', 'Web performance'],
    gaps: ['Ruby on Rails', 'Polaris design system'],
  },
  {
    id: 'job-6',
    title: 'Staff Frontend Engineer',
    company: 'Notion',
    companyData: companies.notion,
    location: 'New York, NY',
    type: 'Full-time',
    workMode: 'Hybrid',
    portal: 'linkedin',
    salary: '$175,000 – $230,000',
    matchScore: 71,
    postedDays: 7,
    tags: ['React', 'TypeScript', 'Rich Text Editors', 'Databases'],
    description: `Notion is on a mission to make it possible for every person, team, and company to be able to tailor their tools to solve any problem. We're looking for a Staff Frontend Engineer to help scale our editor infrastructure.

What you'll do:
• Lead technical direction for Notion's block editor
• Build high-performance editor primitives and abstractions
• Define and evolve frontend architecture for the next generation of Notion
• Mentor engineers across teams

Requirements:
• 7+ years of software engineering, 5+ years focused on frontend
• Deep expertise in React and TypeScript
• Experience building rich text editors or complex document editors
• Strong CS fundamentals
• Track record of technical leadership

Nice to have:
• Experience with ProseMirror, Slate, or Draft.js
• Database or query engine knowledge`,
    strengths: ['React', 'TypeScript', 'Technical leadership', 'Architecture'],
    gaps: ['Rich text editor experience', 'Staff-level leadership track record'],
  },
  {
    id: 'job-7',
    title: 'Frontend Engineer',
    company: 'GitHub',
    companyData: companies.github,
    location: 'Remote',
    type: 'Full-time',
    workMode: 'Remote',
    portal: 'indeed',
    salary: '$145,000 – $190,000',
    matchScore: 80,
    postedDays: 4,
    tags: ['React', 'TypeScript', 'Accessibility', 'Open Source'],
    description: `GitHub is where the world builds software. We're looking for a Frontend Engineer to help build the tools developers love every day.

What you'll do:
• Work on GitHub's web interface used by 100M+ developers
• Ship accessible, performant features at scale
• Contribute to Primer, GitHub's open-source design system
• Collaborate with internal teams and the open source community

Requirements:
• 3+ years of React and TypeScript experience
• Deep commitment to accessibility (ARIA, WCAG)
• Experience building at scale (millions of users)
• Open source mindset and community engagement
• Strong understanding of web standards and browser APIs`,
    strengths: ['React', 'TypeScript', 'Scale experience', 'Open source (OpenDash project)'],
    gaps: ['Accessibility deep expertise', 'Primer system knowledge'],
  },
  {
    id: 'job-8',
    title: 'Frontend Engineer – AI Products',
    company: 'OpenAI',
    companyData: companies.openai,
    location: 'San Francisco, CA',
    type: 'Full-time',
    workMode: 'Hybrid',
    portal: 'linkedin',
    salary: '$180,000 – $250,000',
    matchScore: 88,
    postedDays: 1,
    tags: ['React', 'TypeScript', 'AI/ML', 'Real-time'],
    description: `OpenAI is looking for a Frontend Engineer to help build the interfaces for the world's most advanced AI systems, including ChatGPT and the API platform.

What you'll do:
• Build ChatGPT's web interface and new AI-powered product experiences
• Develop real-time streaming interfaces for AI responses
• Work on the OpenAI API developer platform and playground
• Collaborate with researchers to bring new AI capabilities to users

Requirements:
• 4+ years of frontend experience with React and TypeScript
• Experience building real-time or streaming UIs
• Understanding of AI/ML concepts and APIs
• Excellent UX instincts
• Prior experience integrating AI APIs is a strong plus`,
    strengths: ['React', 'TypeScript', 'OpenAI API integration', 'Real-time features', 'AI product experience'],
    gaps: ['Streaming UI experience', 'ML pipeline knowledge'],
  },
  {
    id: 'job-9',
    title: 'Frontend Engineer – Developer Experience',
    company: 'Supabase',
    companyData: companies.supabase,
    location: 'Remote',
    type: 'Full-time',
    workMode: 'Remote',
    portal: 'indeed',
    salary: '$130,000 – $170,000',
    matchScore: 82,
    postedDays: 6,
    tags: ['React', 'TypeScript', 'Next.js', 'DevTools'],
    description: `Supabase is an open source Firebase alternative. Join us to build the dashboard and developer experience for one of the fastest-growing developer tools.

What you'll do:
• Build and improve the Supabase Studio dashboard with Next.js
• Create interactive SQL editors and database management UIs
• Build developer tooling and documentation experiences
• Contribute to open-source projects

Requirements:
• Strong React and TypeScript skills
• Next.js experience
• Passion for developer tools and open source
• Ability to work autonomously in a remote-first environment
• Experience with SQL or databases is a plus`,
    strengths: ['React', 'TypeScript', 'Next.js', 'Open source', 'Developer tools interest'],
    gaps: ['SQL/database UI experience', 'Async remote work at startup scale'],
  },
  {
    id: 'job-10',
    title: 'Senior React Developer',
    company: 'Atlassian',
    companyData: companies.atlassian,
    location: 'Austin, TX',
    type: 'Full-time',
    workMode: 'Hybrid',
    portal: 'indeed',
    salary: '$150,000 – $195,000',
    matchScore: 73,
    postedDays: 8,
    tags: ['React', 'TypeScript', 'Atlaskit', 'Jira'],
    description: `Atlassian builds tools that help teams work together. We're looking for a Senior React Developer to join the Jira Software team.

What you'll do:
• Build new features and improve existing ones in Jira Software
• Work with Atlaskit, Atlassian's React component library
• Collaborate with PMs, designers, and backend engineers
• Participate in technical planning and architecture discussions

Requirements:
• 5+ years of React development experience
• Strong TypeScript skills
• Experience working on large-scale frontend codebases
• Good understanding of agile software development
• Excellent communication skills`,
    strengths: ['React', 'TypeScript', 'Large-scale codebase experience', 'Component library work'],
    gaps: ['Atlaskit familiarity', 'Jira domain knowledge'],
  },
  {
    id: 'job-11',
    title: 'Frontend Engineer – Community',
    company: 'Discord',
    companyData: companies.discord,
    location: 'Remote',
    type: 'Full-time',
    workMode: 'Remote',
    portal: 'linkedin',
    salary: '$145,000 – $185,000',
    matchScore: 78,
    postedDays: 3,
    tags: ['React', 'TypeScript', 'Real-time', 'WebSockets'],
    description: `Discord powers hundreds of millions of conversations. Join the team building the features our community uses every day.

What you'll do:
• Build real-time features for Discord's web app
• Implement voice, video, and messaging UI components
• Optimize performance for high-frequency updates
• Work with WebSocket and WebRTC-based systems

Requirements:
• 3+ years of React experience in a production environment
• TypeScript proficiency
• Understanding of real-time systems and WebSockets
• Experience with complex state management at scale
• Performance optimization experience`,
    strengths: ['React', 'TypeScript', 'State management', 'Performance optimization'],
    gaps: ['WebRTC', 'High-frequency real-time updates', 'Voice/video UI experience'],
  },
  {
    id: 'job-12',
    title: 'Frontend Engineer – Airbnb for Work',
    company: 'Airbnb',
    companyData: companies.airbnb,
    location: 'San Francisco, CA',
    type: 'Full-time',
    workMode: 'Onsite',
    portal: 'indeed',
    salary: '$160,000 – $210,000',
    matchScore: 68,
    postedDays: 10,
    tags: ['React', 'TypeScript', 'Maps', 'Internationalization'],
    description: `Airbnb is building the future of travel and belonging. The Airbnb for Work team creates tools for corporate travel management.

What you'll do:
• Build B2B dashboard and booking management tools
• Work with mapping and geolocation APIs
• Implement internationalization across multiple languages
• Build payment and expense management UIs

Requirements:
• 4+ years of React and TypeScript experience
• Experience with maps (Google Maps, Mapbox, or similar)
• i18n/l10n experience
• Understanding of B2B product requirements
• Strong design sense and attention to detail`,
    strengths: ['React', 'TypeScript', 'Complex UI work'],
    gaps: ['Maps/geolocation APIs', 'i18n/l10n', 'B2B/enterprise experience'],
  },
];

export const TAILORED_RESUME_SUGGESTIONS = {
  'job-1': {
    summary: 'Highlight Next.js and Vercel deployment experience. Lead with performance optimization work.',
    bullets: [
      'Emphasize the 55% load time reduction with specific metrics',
      'Add any experience with Core Web Vitals or Lighthouse scores',
      'Mention open source contributions (OpenDash)',
      'Highlight CI/CD experience with GitHub Actions',
    ],
  },
  'job-8': {
    summary: 'Lead with AI/LLM integration experience. Emphasize OpenAI API usage and real-time features.',
    bullets: [
      'Move OpenAI API integration to top of experience section',
      'Quantify the AI feature engagement improvement (30% stat)',
      'Add any streaming or SSE implementation experience',
      'Highlight ResumeAI personal project prominently',
    ],
  },
};

export function getMatchColor(score) {
  if (score >= 85) return '#10B981';
  if (score >= 70) return '#F59E0B';
  return '#EF4444';
}

export function getMatchLabel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  return 'Fair';
}

export function getPortalColor(portal) {
  return portal === 'linkedin' ? '#0A66C2' : '#003A9B';
}

export function getWorkModeColor(mode) {
  if (mode === 'Remote') return 'badge-green';
  if (mode === 'Hybrid') return 'badge-blue';
  return 'badge-amber';
}
