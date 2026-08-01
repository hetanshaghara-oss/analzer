/**
 * Job Description Matcher Engine
 * Parses a job description, scores a developer profile against it using heuristics,
 * and produces a tailored resume/portfolio builder state. Mirrors the heuristic
 * "AI" style of aiAnalyzer.js / builderEngine.js — no external API calls.
 */

import { generateAIReport } from './aiAnalyzer';

// ── Skill lexicon: canonical name → aliases (+ optional role affinity) ──────
// Canonical names are the source of truth used everywhere (scoring, tailoring).
const LEXICON = [
  // Languages
  { name: 'JavaScript', aliases: ['javascript', 'js'] },
  { name: 'TypeScript', aliases: ['typescript', 'ts'] },
  { name: 'Python', aliases: ['python'] },
  { name: 'Java', aliases: ['java'] },
  { name: 'C', aliases: ['c'] },
  { name: 'C++', aliases: ['c++'] },
  { name: 'C#', aliases: ['c#'] },
  { name: 'Go', aliases: ['go'] },
  { name: 'Rust', aliases: ['rust'] },
  { name: 'Ruby', aliases: ['ruby'] },
  { name: 'PHP', aliases: ['php'] },
  { name: 'Swift', aliases: ['swift'] },
  { name: 'Kotlin', aliases: ['kotlin'] },
  { name: 'Scala', aliases: ['scala'] },
  { name: 'Shell', aliases: ['shell', 'bash', 'shell scripting'] },
  { name: 'Dart', aliases: ['dart'] },
  { name: 'HTML', aliases: ['html'] },
  { name: 'CSS', aliases: ['css', 'css3'] },
  { name: 'SQL', aliases: ['sql'] },

  // Frontend frameworks
  { name: 'React', aliases: ['react'] },
  { name: 'Vue', aliases: ['vue', 'vue.js'] },
  { name: 'Angular', aliases: ['angular'] },
  { name: 'Svelte', aliases: ['svelte'] },
  { name: 'Next.js', aliases: ['next.js', 'nextjs'] },
  { name: 'Tailwind CSS', aliases: ['tailwind'] },
  { name: 'Redux', aliases: ['redux'] },
  { name: 'Bootstrap', aliases: ['bootstrap'] },
  { name: 'jQuery', aliases: ['jquery'] },

  // Backend frameworks
  { name: 'Node.js', aliases: ['node.js', 'nodejs', 'node'] },
  { name: 'Express', aliases: ['express'] },
  { name: 'NestJS', aliases: ['nestjs', 'nest'] },
  { name: 'Django', aliases: ['django'] },
  { name: 'Flask', aliases: ['flask'] },
  { name: 'FastAPI', aliases: ['fastapi'] },
  { name: 'Spring Boot', aliases: ['spring boot', 'spring'] },
  { name: 'Laravel', aliases: ['laravel'] },
  { name: 'Rails', aliases: ['rails', 'ruby on rails'] },
  { name: '.NET', aliases: ['.net', 'dotnet'] },
  { name: 'GraphQL', aliases: ['graphql'] },
  { name: 'REST APIs', aliases: ['rest api', 'rest apis', 'restful'] },
  { name: 'gRPC', aliases: ['grpc'] },

  // Databases & storage
  { name: 'PostgreSQL', aliases: ['postgresql', 'postgres'] },
  { name: 'MySQL', aliases: ['mysql'] },
  { name: 'MongoDB', aliases: ['mongodb', 'mongo'] },
  { name: 'Redis', aliases: ['redis'] },
  { name: 'SQLite', aliases: ['sqlite'] },
  { name: 'MariaDB', aliases: ['mariadb'] },
  { name: 'Cassandra', aliases: ['cassandra'] },
  { name: 'DynamoDB', aliases: ['dynamodb'] },
  { name: 'Firebase', aliases: ['firebase'] },
  { name: 'Supabase', aliases: ['supabase'] },
  { name: 'Elasticsearch', aliases: ['elasticsearch'] },
  { name: 'Spark', aliases: ['spark', 'apache spark'] },
  { name: 'Kafka', aliases: ['kafka'] },
  { name: 'Prisma', aliases: ['prisma'] },
  { name: 'TypeORM', aliases: ['typeorm'] },

  // Cloud & DevOps
  { name: 'Docker', aliases: ['docker'] },
  { name: 'Kubernetes', aliases: ['kubernetes', 'k8s'] },
  { name: 'AWS', aliases: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'] },
  { name: 'GCP', aliases: ['gcp', 'google cloud'] },
  { name: 'Azure', aliases: ['azure'] },
  { name: 'CI/CD', aliases: ['ci/cd', 'cicd'] },
  { name: 'GitHub Actions', aliases: ['github actions'] },
  { name: 'Jenkins', aliases: ['jenkins'] },
  { name: 'Terraform', aliases: ['terraform'] },
  { name: 'Ansible', aliases: ['ansible'] },
  { name: 'Nginx', aliases: ['nginx'] },
  { name: 'Linux', aliases: ['linux'] },
  { name: 'Helm', aliases: ['helm'] },
  { name: 'Vercel', aliases: ['vercel'] },
  { name: 'Netlify', aliases: ['netlify'] },
  { name: 'Git', aliases: ['git'] },

  // AI / ML
  { name: 'TensorFlow', aliases: ['tensorflow'] },
  { name: 'PyTorch', aliases: ['pytorch'] },
  { name: 'Keras', aliases: ['keras'] },
  { name: 'scikit-learn', aliases: ['scikit-learn', 'sklearn'] },
  { name: 'OpenCV', aliases: ['opencv'] },
  { name: 'NumPy', aliases: ['numpy'] },
  { name: 'Pandas', aliases: ['pandas'] },
  { name: 'OpenAI', aliases: ['openai'] },
  { name: 'LLM', aliases: ['llm', 'large language model'] },
  { name: 'LangChain', aliases: ['langchain'] },
  { name: 'Machine Learning', aliases: ['machine learning', 'ml'] },
  { name: 'NLP', aliases: ['nlp', 'natural language processing'] },
  { name: 'Deep Learning', aliases: ['deep learning'] },
  { name: 'Computer Vision', aliases: ['computer vision'] },
  { name: 'Hugging Face', aliases: ['hugging face', 'transformers'] },

  // Mobile
  { name: 'React Native', aliases: ['react native'] },
  { name: 'Flutter', aliases: ['flutter'] },
  { name: 'Android', aliases: ['android'] },
  { name: 'iOS', aliases: ['ios'] },

  // Testing
  { name: 'Jest', aliases: ['jest'] },
  { name: 'Vitest', aliases: ['vitest'] },
  { name: 'Cypress', aliases: ['cypress'] },
  { name: 'Playwright', aliases: ['playwright'] },
  { name: 'Testing Library', aliases: ['testing library', 'react testing library'] },
  { name: 'Mocha', aliases: ['mocha'] },
  { name: 'Selenium', aliases: ['selenium'] },

  // Build tooling & quality
  { name: 'Vite', aliases: ['vite'] },
  { name: 'Webpack', aliases: ['webpack'] },
  { name: 'npm', aliases: ['npm'] },
  { name: 'Yarn', aliases: ['yarn'] },
  { name: 'pnpm', aliases: ['pnpm'] },
  { name: 'Babel', aliases: ['babel'] },
  { name: 'ESLint', aliases: ['eslint'] },
  { name: 'Prettier', aliases: ['prettier'] },
  { name: 'Unit Testing', aliases: ['unit test', 'unit testing', 'unit tests'] },
  { name: 'TDD', aliases: ['tdd', 'test-driven development'] },
];

// Expected stacks per role (canonical lexicon names) used for the stack score.
const ROLE_STACKS = {
  frontend: ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Redux'],
  backend: ['Node.js', 'Express', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Rails', 'Go', 'Java', 'Python', 'C#', 'PHP', 'GraphQL', 'REST APIs'],
  ml: ['Python', 'TensorFlow', 'PyTorch', 'Keras', 'scikit-learn', 'Pandas', 'NumPy', 'OpenAI', 'LangChain', 'Machine Learning', 'NLP'],
  devops: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions', 'Linux', 'CI/CD', 'Helm', 'Nginx'],
  data: ['Python', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Pandas', 'NumPy', 'Elasticsearch', 'Spark', 'Kafka'],
  mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Android', 'iOS'],
  fullstack: ['React', 'Vue', 'Angular', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Go', 'Java', 'Python', 'GraphQL', 'REST APIs'],
  general: [],
};

// Keywords used to detect the role type of a job description.
const ROLE_PATTERNS = {
  frontend: ['react', 'vue', 'angular', 'svelte', 'next.js', 'tailwind', 'css', 'html', 'frontend', 'front-end', 'ui/ux', 'redux', 'javascript', 'typescript'],
  backend: ['node', 'express', 'django', 'flask', 'fastapi', 'spring', 'laravel', 'rails', 'backend', 'back-end', 'rest api', 'microservice', 'graphql', 'golang', 'java', 'c#', 'php', 'postgresql', 'mongodb', 'mysql', 'sql', 'api'],
  ml: ['tensorflow', 'pytorch', 'keras', 'machine learning', 'deep learning', 'nlp', 'llm', 'openai', 'langchain', 'data science', 'computer vision', 'neural network'],
  devops: ['docker', 'kubernetes', 'k8s', 'aws', 'gcp', 'azure', 'devops', 'ci/cd', 'terraform', 'jenkins', 'sre', 'infrastructure', 'linux', 'shell', 'cloud', 'helm'],
  data: ['data engineer', 'etl', 'data pipeline', 'spark', 'kafka', 'airflow', 'snowflake', 'bigquery', 'pandas', 'numpy', 'data analysis'],
  mobile: ['react native', 'flutter', 'swift', 'kotlin', 'android', 'ios'],
};

const ROLE_LABELS = {
  frontend: 'Frontend Engineer',
  backend: 'Backend Engineer',
  ml: 'Machine Learning Engineer',
  devops: 'DevOps Engineer',
  data: 'Data Engineer',
  mobile: 'Mobile Engineer',
  fullstack: 'Full-Stack Engineer',
  general: 'Software Engineer',
};

const LEVEL_RANKS = { junior: 1, mid: 2, senior: 3, lead: 4, principal: 5 };
const CANDIDATE_LEVEL_RANKS = {
  'Junior Engineer': 1,
  'Mid-Level Engineer': 2,
  'Senior Software Engineer': 3,
  'Principal / Tech Lead': 4,
};

// ── Text helpers ────────────────────────────────────────────────────────────

// Word-boundary aware substring test. Aliases containing '+' / '#' or starting
// with '.' can't use \b, so fall back to a plain includes() for those.
function aliasInText(text, alias) {
  if (!text) return false;
  const special = alias.includes('#') || alias.includes('+') || alias.startsWith('.');
  if (special) return text.includes(alias);
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}

function extractSkillsFromText(text) {
  const found = new Set();
  if (!text) return found;
  const lower = text.toLowerCase();
  LEXICON.forEach(entry => {
    if (entry.aliases.some(alias => aliasInText(lower, alias))) found.add(entry.name);
  });
  return found;
}

function detectRoleType(lower) {
  let best = 'general';
  let bestScore = 0;
  Object.entries(ROLE_PATTERNS).forEach(([role, keywords]) => {
    const score = keywords.filter(k => aliasInText(lower, k)).length;
    if (score > bestScore) { bestScore = score; best = role; }
  });
  // Balanced frontend + backend presence (and no other category clearly
  // dominating) reads as full-stack. A frontend JD that merely mentions
  // Node.js/SQL in a "preferred" section stays a frontend role.
  const fe = ROLE_PATTERNS.frontend.filter(k => aliasInText(lower, k)).length;
  const be = ROLE_PATTERNS.backend.filter(k => aliasInText(lower, k)).length;
  if (fe >= 2 && be >= 2 && Math.abs(fe - be) <= 1 && bestScore <= Math.max(fe, be)) return 'fullstack';
  return bestScore > 0 ? best : 'general';
}

function extractYears(lower) {
  const match = lower.match(/(\d{1,2})\s*\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:experience|exp))?/i);
  return match ? parseInt(match[1], 10) : null;
}

function detectLevel(lower, years) {
  if (/\bprincipal\b|\bstaff\b/.test(lower)) return 'principal';
  if (/\blead\b/.test(lower)) return 'lead';
  if (/\bsenior\b/.test(lower)) return 'senior';
  if (/\bmid[\s-]level\b/.test(lower)) return 'mid';
  if (/\bjunior\b|\bentry[\s-]level\b/.test(lower)) return 'junior';
  if (years) { if (years >= 7) return 'senior'; if (years >= 3) return 'mid'; return 'junior'; }
  return 'unknown';
}

function buildTitle(text, roleType, level) {
  const match = text.match(
    /\b(?:(junior|mid[\s-]level|senior|lead|principal|staff|entry[\s-]level)\s+)?(?:level\s+)?(?:(front[\s-]?end|back[\s-]?end|full[\s-]?stack|software|web|mobile|devops|machine[\s-]?learning|data|cloud|qa|ui\/?ux|android|ios)\s+)?(engineer|developer|architect|scientist|analyst|specialist)\b/i
  );
  if (match) {
    const [levelWord, typeWord, roleWord] = [match[1], match[2], match[3]].map(w =>
      w ? w.replace(/[\s-]+/g, ' ') : ''
    );
    const pieces = [levelWord && capitalize(levelWord), typeWord && capitalize(typeWord), roleWord && capitalize(roleWord)].filter(Boolean);
    // A bare role word ("Engineer") is lower-quality than the role-label fallback
    // (e.g. "DevOps Engineer" for "DevOps / SRE Engineer"), so only trust the
    // regex when it captured a level or type prefix.
    if (pieces.length >= 2) return pieces.join(' ');
  }
  const base = ROLE_LABELS[roleType] || 'Software Engineer';
  // Only prepend the level when it is spelled out in the JD (not inferred from years).
  const explicitLevel = level !== 'unknown' && new RegExp(`\\b${level}\\b`, 'i').test(text);
  return explicitLevel ? `${capitalize(level)} ${base}` : base;
}

function capitalize(str) {
  if (str === 'gcp') return 'Google Cloud Platform (GCP)';
  if (str === 'aws') return 'Amazon Web Services (AWS)';
  if (str === 'ml') return 'Machine Learning';
  if (str === 'ci/cd') return 'CI/CD';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── Parsing ─────────────────────────────────────────────────────────────────

export function parseJobDescription(text) {
  const raw = text || '';
  const lower = raw.toLowerCase();

  // Split off any "preferred / nice to have" section — those count half-weight.
  const preferredMarker = lower.search(/\b(preferred|nice to have|nice-to-have|bonus points?|a plus|plus:)\b/);
  const requiredZone = preferredMarker === -1 ? raw : raw.slice(0, preferredMarker);
  const preferredZone = preferredMarker === -1 ? '' : raw.slice(preferredMarker);

  const roleType = detectRoleType(lower);
  const yearsRequired = extractYears(lower);
  const level = detectLevel(lower, yearsRequired);
  const title = buildTitle(raw, roleType, level);

  return {
    title,
    roleType,
    level,
    yearsRequired,
    requiredSkills: [...extractSkillsFromText(requiredZone)],
    preferredSkills: [...extractSkillsFromText(preferredZone)],
    keywords: [...extractSkillsFromText(raw)],
  };
}

// ── Candidate skill set ─────────────────────────────────────────────────────

function buildCandidateSkills(builderState, stats, repos) {
  const found = new Set();
  const addToken = token => {
    const t = (token || '').toLowerCase();
    if (!t) return;
    LEXICON.forEach(entry => {
      if (entry.aliases.some(alias => aliasInText(t, alias))) found.add(entry.name);
    });
  };

  (builderState.skills || []).forEach(group => (group.items || []).forEach(addToken));
  (stats.languages || []).forEach(lang => addToken(lang.name));
  (repos || []).forEach(repo => {
    (repo.topics || []).forEach(addToken);
    const text = `${repo.name || ''} ${repo.description || ''}`.toLowerCase();
    LEXICON.forEach(entry => {
      if (entry.aliases.some(alias => aliasInText(text, alias))) found.add(entry.name);
    });
  });

  return found;
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function computeStackScore(roleType, candidate) {
  const expected = ROLE_STACKS[roleType] || [];
  if (expected.length === 0) return 100;
  const overlap = expected.filter(skill => candidate.has(skill)).length;
  return Math.round((overlap / expected.length) * 100);
}

function computeLevelScore(jd, userData, stats, repos) {
  const requiredRank = LEVEL_RANKS[jd.level];
  if (!requiredRank) return 100;
  let candidateRank = 2;
  try {
    const level = generateAIReport(userData, stats, repos).roadmap.level;
    candidateRank = CANDIDATE_LEVEL_RANKS[level] || 2;
  } catch {
    candidateRank = 2;
  }
  const diff = Math.max(0, requiredRank - candidateRank);
  return Math.max(0, 100 - diff * 25);
}

function scoreProjects(keywords, repos) {
  if (!repos || repos.length === 0) return { score: 0, relevant: [] };
  const top = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 8);
  const lowerKeywords = keywords.map(k => k.toLowerCase());

  const scored = top.map(repo => {
    const text = `${repo.name || ''} ${repo.description || ''} ${(repo.topics || []).join(' ')}`.toLowerCase();
    const hits = lowerKeywords.filter(k => text.includes(k)).length;
    return { repo, hits };
  });

  const relevantCount = scored.filter(s => s.hits > 0).length;
  const score = Math.round((relevantCount / scored.length) * 100);
  const relevant = scored
    .sort((a, b) => (b.hits - a.hits) || (b.repo.stargazers_count - a.repo.stargazers_count))
    .slice(0, 4)
    .map(s => ({
      name: s.repo.name,
      description: s.repo.description || 'No description',
      language: s.repo.language || '',
      stars: s.repo.stargazers_count,
      relevance: s.hits,
    }));

  return { score, relevant };
}

function computeActivityScore(stats) {
  const o = stats.overview || {};
  const avgStars = Number(o.avgStars) || 0;
  return Math.min(
    100,
    Math.round(
      30 +
      Math.min(30, (o.totalStars || 0) * 1) +
      ((o.totalRepos || 0) >= 10 ? 15 : (o.totalRepos || 0) * 1.5) +
      ((o.totalLanguagesUsed || 0) >= 3 ? 15 : 0) +
      (avgStars > 2 ? 10 : 0)
    )
  );
}

function buildRoleFit(roleType, stackScore) {
  const label = ROLE_LABELS[roleType] || 'Software Engineer';
  const fit = stackScore >= 75 ? 'Strong' : stackScore >= 50 ? 'Good' : stackScore >= 30 ? 'Partial' : 'Weak';
  return {
    roleType,
    label,
    fit,
    note: `The profile aligns ${fit.toLowerCase()} with the ${label.toLowerCase()} track based on detected stack overlap.`,
  };
}

function buildRecommendations({ skillsScore, levelScore, projectsScore, activityScore, missingRequired, missingPreferred, verdict }) {
  const recs = [];
  if (missingRequired.length > 0) {
    recs.push(`Highlight demonstrable experience with ${missingRequired.slice(0, 3).join(', ')} — add a public project or OSS contribution to evidence these skills.`);
  }
  if (missingPreferred.length > 0) {
    recs.push(`Targeted for "nice-to-have" items: ${missingPreferred.slice(0, 3).join(', ')} — mentioning adjacent exposure in the summary strengthens the application.`);
  }
  if (skillsScore < 65 && recs.length === 0) {
    recs.push('Reshape the skills section so the most job-relevant technologies appear first.');
  }
  if (projectsScore < 60) {
    recs.push('Rewrite top project descriptions with keywords from the target role so relevance is obvious at a glance.');
  }
  if (activityScore < 50) {
    recs.push('Recent activity matters — surface your current streak and latest contributions to demonstrate momentum.');
  }
  if (levelScore < 70) {
    recs.push('The role targets a higher seniority band — emphasize scope, ownership, and community impact to bridge the gap.');
  }
  if (recs.length === 0) {
    recs.push(verdict === 'Strong Match' ? 'Excellent alignment. The tailored resume highlights the strongest overlap for this exact role.' : 'Solid baseline — apply the tailored resume and tune the summary for each application.');
  }
  return recs.slice(0, 4);
}

// ── Public API ──────────────────────────────────────────────────────────────

export function matchDeveloperToJob(jdText, userData, builderState, stats, repos) {
  const jd = parseJobDescription(jdText);
  const candidate = buildCandidateSkills(builderState, stats, repos);
  const has = skill => candidate.has(skill);

  // Skills (40%)
  let weightedTotal = 0;
  let weightedMatched = 0;
  jd.requiredSkills.forEach(s => { weightedTotal += 1; if (has(s)) weightedMatched += 1; });
  jd.preferredSkills.forEach(s => { weightedTotal += 0.5; if (has(s)) weightedMatched += 0.5; });
  const matchedSkills = [...new Set([...jd.requiredSkills, ...jd.preferredSkills])].filter(has);
  const missingRequired = jd.requiredSkills.filter(s => !has(s));
  const missingPreferred = jd.preferredSkills.filter(s => !has(s));
  const skillsScore = weightedTotal === 0 ? 0 : Math.round((weightedMatched / weightedTotal) * 100);

  // Stack (20%), level (15%), projects (15%), activity (10%)
  const stackScore = computeStackScore(jd.roleType, candidate);
  const levelScore = computeLevelScore(jd, userData, stats, repos);
  const { score: projectsScore, relevant: relevantProjects } = scoreProjects(jd.keywords, repos);
  const activityScore = computeActivityScore(stats);

  const overall = Math.round(0.40 * skillsScore + 0.20 * stackScore + 0.15 * levelScore + 0.15 * projectsScore + 0.10 * activityScore);
  const verdict = overall >= 80 ? 'Strong Match' : overall >= 65 ? 'Good Fit' : overall >= 45 ? 'Partial Match' : 'Needs Attention';

  return {
    jobTitle: jd.title,
    roleType: jd.roleType,
    level: jd.level,
    yearsRequired: jd.yearsRequired,
    overall,
    verdict,
    categories: { skills: skillsScore, stack: stackScore, level: levelScore, projects: projectsScore, activity: activityScore },
    matchedSkills,
    missingSkills: missingRequired,
    missingPreferred,
    roleFit: buildRoleFit(jd.roleType, stackScore),
    relevantProjects,
    recommendations: buildRecommendations({ jd, skillsScore, stackScore, levelScore, projectsScore, activityScore, missingRequired, missingPreferred, verdict }),
    parsed: jd,
  };
}

// ── Tailoring ───────────────────────────────────────────────────────────────

function reorderMatchedFirst(items, matched) {
  const matchedLower = new Set(matched.map(s => s.toLowerCase()));
  const matchedItems = items.filter(i => matchedLower.has(i.toLowerCase()));
  const rest = items.filter(i => !matchedLower.has(i.toLowerCase()));
  return [...matchedItems, ...rest];
}

function rankProjects(projects, keywords) {
  if (!projects) return [];
  const lowerKeywords = keywords.map(k => k.toLowerCase());
  return [...projects]
    .map(proj => {
      const text = `${proj.name || ''} ${proj.description || ''}`.toLowerCase();
      const relevance = lowerKeywords.filter(k => text.includes(k)).length;
      return { proj, relevance };
    })
    .sort((a, b) => (b.relevance - a.relevance) || (b.proj.stars - a.proj.stars))
    .slice(0, 4)
    .map(({ proj }) => proj);
}

export function tailorBuilderState(builderState, matchResult, jd, stats) {
  const matched = matchResult.matchedSkills || [];
  const jobTitle = jd.title || matchResult.roleFit?.label || 'Target Role';
  const roleLabel = matchResult.roleFit?.label || 'software engineer';
  const totalRepos = stats?.overview?.totalRepos ?? 0;
  const totalStars = stats?.overview?.totalStars ?? 0;
  const topMatched = matched.slice(0, 5).join(', ');

  const bio =
    `Experienced ${roleLabel} with demonstrated expertise in ${topMatched || 'modern software engineering'}. ` +
    `A portfolio of ${totalRepos} GitHub repositories (${totalStars} stars) showcases hands-on, production-quality work directly aligned with the ${jobTitle} role.`;

  // Skills: prepend a targeted category, then reorder existing categories.
  const targetedCategory = matched.length ? { category: `Targeted for ${jobTitle}`, items: matched.slice(0, 8) } : null;
  const existingCategories = (builderState.skills || []).map(group => ({
    category: group.category,
    items: reorderMatchedFirst(group.items || [], matched),
  }));
  const skills = targetedCategory ? [targetedCategory, ...existingCategories] : existingCategories;

  // Projects re-ranked by JD keyword overlap.
  const projects = rankProjects(builderState.projects, jd.keywords);

  // Achievements: prepend a tailored bullet.
  const tailoredAchievement = `Aligned GitHub portfolio with ${jobTitle} requirements, demonstrating ${matched.slice(0, 3).join(', ') || 'a focused technical stack'}.`;
  const achievements = [tailoredAchievement, ...(builderState.achievements || [])].slice(0, 5);

  // Ensure the skills section sits near the top.
  const sectionOrder = [...(builderState.sectionOrder || ['about', 'skills', 'stats', 'projects', 'experience', 'education'])];
  const skillsIdx = sectionOrder.indexOf('skills');
  if (skillsIdx > 1) {
    sectionOrder.splice(skillsIdx, 1);
    sectionOrder.splice(1, 0, 'skills');
  }

  return {
    ...builderState,
    personalInfo: { ...builderState.personalInfo, title: jobTitle, bio },
    skills,
    projects,
    achievements,
    sectionOrder,
  };
}

export { ROLE_LABELS, ROLE_STACKS };
