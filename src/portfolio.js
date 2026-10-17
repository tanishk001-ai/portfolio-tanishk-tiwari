// All page copy. Facts only come from the owner's brief; anything unconfirmed is a TODO(VERIFY) comment, not shipped text.

export const profile = {
  name: 'Tanishk Tiwari',
  email: 'tanishktiwari0101@gmail.com',   // confirmed spelling: tiwari (the old live site had a "tiwati" typo)
  linkedin: 'https://www.linkedin.com/in/tanishk-tiwari-83486a287/',
  github: 'https://github.com/tanishk001-ai',
  resume: '/resume.pdf',                  // TODO(VERIFY): add the resume PDF at public/resume.pdf — the file is not in the repo yet, so this link 404s until it is.
  subline: 'CS undergrad at VIT Bhopal. I turn product and user data into decisions, and ship the code. Open to PM internships.',
  graduating: 'Graduating May 2027',
  availability: 'Open for internships now, full-time from May 2027.',
}

export const chips = ['All', 'Client work', 'Product analysis', 'AI & data', 'Hackathons']

// Tier 1: full case studies (Problem / What I did / Result)
export const cases = [
  {
    id: 'sgc', cats: ['Client work'],
    title: 'Shiv Gayatri Core',
    meta: 'Freelance Software Architect & Developer · May 2026 to present',
    problem: 'A construction and real estate client in Bhopal ran land, sales, rental, construction and accounting on scattered tools.',
    did: 'Gathered requirements, scoped a 6-module offline Windows suite on a SQL data model, built a bank-statement tool that sorts transactions under accounting heads, and migrated 29 properties plus a 106-plot colony dataset.',
    result: "Live on the client's hardware since July 2026, 250+ automated tests, a seventh module in progress.",
    metrics: [['6', 'modules'], ['29', 'properties migrated'], ['106', 'plot colony dataset'], ['250+', 'automated tests']],
    stack: ['PyQt6', 'SQLAlchemy', 'SQLite', 'PyInstaller'],
  },
  {
    id: 'zoho', cats: ['Product analysis'],
    title: 'Zoho Inventory Activation Audit',
    meta: 'PM intern task · Jul 2026',
    problem: 'New users stall before their first successful order.',
    did: 'Timed first-time-user sessions with click counts, validated hypotheses against G2, Capterra and forum reviews and release notes, and ranked 5 fixes on impact vs effort.',
    result: 'Found a first order that failed after 70+ clicks and 100+ minutes of manual setup for a 50-SKU catalog. Defined the KPIs (median error resolution under 30 seconds, abandonment after error under 10%), tracking events and a staged A/B rollout.',
    metrics: [['70+', 'clicks to a failed first order'], ['100+', 'minutes of manual setup'], ['5', 'fixes ranked']],
    stack: [],
    // TODO(VERIFY): can the write-up be shown publicly? If yes, add a "Read the audit" link/PDF in /public and put it in `links`.
  },
  {
    id: 'ops', cats: ['AI & data'],
    title: 'Restaurant Ops Copilot',
    meta: 'Approved, Swiggy Builders Club',
    problem: 'Guesswork ordering drives 15 to 25% food-cost waste.',
    did: 'Built an XGBoost demand forecast, BOM explosion, shortfall diff, and a Swiggy Instamart draft cart through a planner-verifier loop, with a human approval gate before anything is ordered.',
    result: '13.5% MAPE backtested on 58 days over 15 months, 94 tests across 9 suites.',
    metrics: [['13.5%', 'MAPE, backtested'], ['58', 'days over 15 months'], ['94', 'tests, 9 suites']],
    stack: ['Python', 'FastAPI', 'XGBoost', 'Claude API', 'PostgreSQL', 'pgvector', 'Docker'],
    links: [['GitHub', 'https://github.com/tanishk001-ai/restaurant-ops-copilot']],
  },
  {
    id: 'gng', cats: ['Client work'],
    title: 'Green And Grains Inventory System',
    meta: 'Software Development & Systems Intern, Vishalya Foods and Farms · Jan to Jul 2026',
    problem: 'A perishable vegetable business lost value through shrinkage and sorting degradation, with D2C and B2B sales tracked by hand in spreadsheets.',
    did: 'Built an inventory system from scratch tracking intake, storage, shrinkage and sales by channel.',
    result: 'One data-driven view of stock and channel performance replacing spreadsheets.',
    metrics: [],
    stack: [],
    // TODO(VERIFY): "internship" vs founder/operator framing. Do NOT call this a "procurement system".
    // TODO(VERIFY): add the internship certificate link from the resume (in `links`).
  },
]

// Tier 2: compact rows
export const rows = [
  { id: 'astro', name: 'AstroLive Reimagined', badge: 'AstroHack 2026 Finalist', cats: ['Product analysis', 'Hackathons'], tags: ['Teardown', 'Prototype'], url: 'https://github.com/tanishk001-ai/astrolive',
    text: '18-page teardown of a live consultation marketplace (Seeker vs Learner segmentation, monetization, features, success metrics) plus a working Consult/Learn prototype.' },
  { id: 'unpacked', name: 'Unpacked', badge: 'Build What Moves India', cats: ['Product analysis', 'Hackathons'], tags: ['Consumer', 'EN/HI'], url: 'https://github.com/tanishk001-ai/property-tax-unpacked',
    text: 'Property tax bill explainer with a line-by-line breakdown, rebate detection, per-line dispute flow and an English/Hindi toggle.' },
  { id: 'buzztrk', name: 'BuzzTrk', cats: ['AI & data'], tags: ['Personal finance', 'PDF parsing'], url: 'https://github.com/tanishk001-ai/buzztrk',
    text: 'Personal-finance visibility for first-time earners in India: client-side bank-statement PDF parsing, UPI narration cleanup, auto-categorisation, budgets.' },
  { id: 'wc', name: 'WC Fever 2026', cats: ['AI & data'], tags: ['Flask', 'React', 'XGBoost'], url: 'https://github.com/tanishk001-ai/wc_fever_2026',
    // TODO(VERIFY): add the Live link URL for WC Fever 2026.
    text: 'Live World Cup analytics dashboard with xG shot maps, group standings, a live bracket and an XGBoost match predictor.' },
  { id: 'qc', name: 'QueryCraft', cats: ['AI & data'], tags: ['T5', 'MySQL'], url: 'https://github.com/tanishk001-ai/QueryCraft',
    text: 'A fine-tuned T5 turns plain English into SQL and runs it live on MySQL.' },
  { id: 'carb', name: 'CarbMine', cats: ['AI & data'], tags: ['React', 'Flask', 'Pandas', 'ReportLab'], url: 'https://github.com/tanishk001-ai/CarbMine',
    text: 'Carbon footprint assessment for Indian coal mines: Scope 1/2/3, CSV bulk upload, PDF sustainability reports.' },
  { id: 'fabrik', name: 'FABRIK Design2Code', badge: '1st place, 1,000+ entries', cats: ['Hackathons'], tags: ['Frontend'], url: 'https://github.com/tanishk001-ai/fabrik-design2code',
    text: 'Brutalist industrial studio UI.' },
  { id: 'ty', name: 'TravelYatri', badge: 'Co-founded 2023 to 2024', cats: ['Product analysis'], tags: ['Co-founder', 'Product'],
    // TODO(VERIFY): any user/trip numbers. None confirmed, so this row says what was learned instead.
    text: 'A Gen Z travel platform for college students. I owned the roadmap, user research and prioritisation, and learned the gap between a good idea and a working product.' },
  { id: 'resume', name: 'Smart Resume Generator', cats: [], tags: ['React', 'Vite', 'Supabase'], url: 'https://github.com/tanishk001-ai/smartresume-generator',
    text: 'ATS-friendly resume builder.' },
]

// Tier 3
export const also = [
  { name: 'Internship hunt pipeline', cats: ['AI & data'], text: 'Supabase + Notion + Gmail: sources leads, dedupes companies, drafts outreach.' },
  // TODO(VERIFY): PodLaunch (final-year capstone, mini PaaS) — wording not confirmed, so it is not shown.
]

export const about = {
  summary: 'I am a CS undergrad at VIT Bhopal who turns product and user data into decisions, then ships the code. I have built for real clients and competed in product and engineering hackathons.',
  education: [['B.E. Computer Science (Cloud Computing and Automation)', 'VIT Bhopal, expected May 2027']],
  // TODO(VERIFY): the brief lists "(1000/1000)" after AI Practitioner; assumed it is that exam's score.
  certs: ['AWS Solutions Architect Associate', 'AWS Developer Associate', 'AWS AI Practitioner (1000/1000)', 'Azure Data Fundamentals', 'Google Generative AI Fundamentals'],
  recognition: ['EY CAFTA Case Study Championship', '1st place, Design2Code'],
  community: ['Bit By Bit Club event team: campus events for 300 to 400 students', 'GDGC member'],
}
