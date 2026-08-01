/* ══════════════════════════════════════════════
   Interview Engine — generates questions from
   a developer's actual repos, scores answers
   against code context, produces a report card.
══════════════════════════════════════════════ */

// ── Language-specific question banks ──
const LANGUAGE_QUESTIONS = {
  JavaScript: [
    { q: 'Explain the difference between `var`, `let`, and `const` in JavaScript. When would you use each?', keywords: ['scope', 'hoisting', 'block', 'immutable', 'reassign', 'global', 'function'], category: 'language' },
    { q: 'What is the event loop in JavaScript, and how do `setTimeout`, Promises, and `async/await` relate to it?', keywords: ['callback', 'queue', 'microtask', 'macrotask', 'promise', 'async', 'await', 'stack'], category: 'language' },
    { q: 'How does prototypal inheritance work in JavaScript? How does it differ from class-based inheritance?', keywords: ['prototype', 'chain', '__proto__', 'object', 'extend', 'class', 'instance'], category: 'language' },
    { q: 'Explain closures. Give a practical example of when you would use one.', keywords: ['closure', 'scope', 'function', 'reference', 'inner', 'outer', 'variable', 'persistent'], category: 'language' },
    { q: 'What are the performance implications of using `Array.map()` vs `Array.forEach()` vs a `for` loop?', keywords: ['map', 'forEach', 'loop', 'iterate', 'allocation', 'performance', 'return', 'new array'], category: 'language' },
  ],
  TypeScript: [
    { q: 'Explain the difference between `interface` and `type` in TypeScript. When would you prefer one over the other?', keywords: ['interface', 'type', 'extend', 'intersect', 'declaration', 'merge', 'generic'], category: 'language' },
    { q: 'What are discriminated unions in TypeScript? How do they improve type safety?', keywords: ['discriminant', 'union', 'tag', 'narrowing', 'type guard', 'switch', 'exhaustive'], category: 'language' },
    { q: 'How do TypeScript generics work? Give an example of a generic utility type you\'ve used or built.', keywords: ['generic', 'type parameter', 'constraint', 'extends', 'utility', 'Pick', 'Omit', 'Partial'], category: 'language' },
    { q: 'Explain `unknown` vs `any` in TypeScript. Why is `unknown` safer?', keywords: ['unknown', 'any', 'type check', 'narrow', 'safe', 'runtime', 'validation'], category: 'language' },
    { q: 'What is the `infer` keyword in TypeScript? How is it used in conditional types?', keywords: ['infer', 'conditional', 'extract', 'type', 'inference', 'pattern', 'match'], category: 'language' },
  ],
  Python: [
    { q: 'Explain list comprehensions vs generator expressions in Python. When would you use each?', keywords: ['comprehension', 'generator', 'memory', 'lazy', 'iterator', 'yield', 'list'], category: 'language' },
    { q: 'What is the Global Interpreter Lock (GIL) in Python? How does it affect multithreading?', keywords: ['GIL', 'thread', 'process', 'concurrent', 'parallel', 'mutex', 'lock', 'asyncio'], category: 'language' },
    { q: 'How does Python\'s memory management work? Explain reference counting and garbage collection.', keywords: ['reference', 'count', 'garbage', 'collect', 'cycle', 'weakref', 'memory', 'pool'], category: 'language' },
    { q: 'Explain decorators in Python. How would you write a reusable logging decorator?', keywords: ['decorator', 'wrapper', 'function', 'closure', 'functools', 'wraps', 'arguments'], category: 'language' },
    { q: 'What are metaclasses in Python? When would you actually use one?', keywords: ['metaclass', '__class__', 'type', 'class', 'instance', 'create', 'override'], category: 'language' },
  ],
  Rust: [
    { q: 'Explain Rust\'s ownership system. How does it prevent memory bugs without a garbage collector?', keywords: ['ownership', 'borrow', 'lifetime', 'move', 'copy', 'clone', 'stack', 'heap'], category: 'language' },
    { q: 'What is the difference between `String` and `&str` in Rust? When would you use each?', keywords: ['String', 'str', 'slice', 'owned', 'borrowed', 'heap', 'stack', 'deref'], category: 'language' },
    { q: 'How do lifetimes work in Rust? Give an example of a lifetime annotation.', keywords: ['lifetime', 'borrow', 'reference', 'annotation', 'generic', 'compile', 'elision'], category: 'language' },
    { q: 'Explain the `Option` and `Result` types. How do they replace null/exceptions?', keywords: ['Option', 'Result', 'Some', 'None', 'Ok', 'Err', 'unwrap', 'match', 'pattern'], category: 'language' },
    { q: 'What are traits in Rust? How do they compare to interfaces in other languages?', keywords: ['trait', 'impl', 'dyn', 'static', 'dispatch', 'blanket', 'derive', 'bound'], category: 'language' },
  ],
  Java: [
    { q: 'Explain the difference between `==` and `.equals()` in Java. When would you override `equals()`?', keywords: ['equals', 'hashcode', 'reference', 'value', 'override', 'contract', 'object'], category: 'language' },
    { q: 'What are the SOLID principles? Give a practical example of one from your code.', keywords: ['single', 'open', 'liskov', 'interface', 'dependency', 'solid', 'principle'], category: 'architecture' },
    { q: 'How does Java\'s garbage collector work? What are the different GC algorithms?', keywords: ['garbage', 'collect', 'mark', 'sweep', 'generational', 'heap', 'young', 'old'], category: 'language' },
    { q: 'Explain the difference between `HashMap` and `ConcurrentHashMap`. When would you use each?', keywords: ['HashMap', 'ConcurrentHashMap', 'thread', 'safe', 'synchronized', 'concurrent', 'lock'], category: 'language' },
    { q: 'What are streams in Java? How do they differ from collections?', keywords: ['stream', 'pipeline', 'lazy', 'parallel', 'intermediate', 'terminal', 'functional'], category: 'language' },
  ],
  Go: [
    { q: 'Explain goroutines and channels in Go. How do they enable concurrency?', keywords: ['goroutine', 'channel', 'go', 'select', 'buffered', 'concurrent', 'sync'], category: 'language' },
    { q: 'What are interfaces in Go? How does Go\'s implicit interface implementation work?', keywords: ['interface', 'implicit', 'satisfaction', 'type', 'method', 'duck', 'polymorphism'], category: 'language' },
    { q: 'How does error handling work in Go? Why does Go use `if err != nil` instead of try/catch?', keywords: ['error', 'nil', 'return', 'panic', 'recover', 'wrap', 'unwrap', 'fmt.Errorf'], category: 'language' },
    { q: 'Explain the `defer` keyword in Go. What is the order of deferred calls?', keywords: ['defer', 'stack', 'LIFO', 'panic', 'recover', 'cleanup', 'resource'], category: 'language' },
    { q: 'What are context.Context packages used for in Go?', keywords: ['context', 'cancel', 'timeout', 'deadline', 'value', 'propagation', 'request'], category: 'language' },
  ],
  'C++': [
    { q: 'Explain the difference between stack and heap memory allocation in C++.', keywords: ['stack', 'heap', 'new', 'delete', 'malloc', 'free', 'smart pointer', 'RAII'], category: 'language' },
    { q: 'What are smart pointers in C++? Explain `unique_ptr`, `shared_ptr`, and `weak_ptr`.', keywords: ['unique_ptr', 'shared_ptr', 'weak_ptr', 'ownership', 'reference count', 'RAII', 'memory'], category: 'language' },
    { q: 'Explain move semantics and rvalue references in C++.', keywords: ['move', 'rvalue', 'lvalue', 'reference', 'std::move', 'copy', 'constructor', 'efficient'], category: 'language' },
    { q: 'What is the Rule of Five in C++? When do you need to define them?', keywords: ['destructor', 'copy', 'move', 'constructor', 'operator', 'RAII', 'resource'], category: 'language' },
    { q: 'How do templates work in C++? What is template metaprogramming?', keywords: ['template', 'generic', 'compile', 'specialization', 'SFINAE', 'concept', 'type'], category: 'language' },
  ],
};

// ── Generic architecture / quality questions (all languages) ──
const ARCHITECTURE_QUESTIONS = [
  { q: 'Looking at this repository\'s structure, explain the architectural pattern used. What are its trade-offs?', keywords: ['pattern', 'structure', 'modular', 'layer', 'separation', ' MVC', 'component', 'directory'], category: 'architecture' },
  { q: 'How does this project handle error handling and edge cases? What would you improve?', keywords: ['error', 'try', 'catch', 'boundary', 'fallback', 'validation', 'edge case', 'robust'], category: 'quality' },
  { q: 'Describe the testing strategy you would use for this codebase. What types of tests are most important?', keywords: ['test', 'unit', 'integration', 'e2e', 'mock', 'fixture', 'coverage', 'assert'], category: 'quality' },
  { q: 'How would you scale this application to handle 10x more users? What bottlenecks do you see?', keywords: ['cache', 'database', 'load', 'balance', 'scale', 'horizontal', 'vertical', 'CDN', 'optimize'], category: 'architecture' },
  { q: 'What security considerations are important for this type of application? Name specific vulnerabilities.', keywords: ['XSS', 'CSRF', 'SQL injection', 'authentication', 'authorization', 'sanitiz', 'encrypt', 'token'], category: 'quality' },
  { q: 'If you had to refactor one part of this codebase to improve maintainability, what would you choose and why?', keywords: ['refactor', 'clean', 'DRY', 'SOLID', 'readable', 'decouple', 'abstract', 'interface'], category: 'quality' },
  { q: 'How would you implement CI/CD for this project? What should the pipeline include?', keywords: ['CI', 'CD', 'pipeline', 'lint', 'test', 'build', 'deploy', 'docker', 'automate'], category: 'quality' },
];

// ── Question generation ──

/**
 * Generate interview questions for a repository.
 * @param {object} repo — GitHub repo object (with languages, description, etc.)
 * @param {object} userData — GitHub user object
 * @param {object} stats — calculatedStatistics result
 * @returns {{ questions: Array, context: object }}
 */
export function generateInterviewQuestions(repo, userData, _stats) {
  const langKey = getTopLanguage(repo);
  const langQuestions = LANGUAGE_QUESTIONS[langKey] || LANGUAGE_QUESTIONS.JavaScript;

  // Pick 5 language questions
  const pickedLang = shuffle(langQuestions).slice(0, 5);

  // Pick 3 architecture / quality questions
  const pickedArch = shuffle(ARCHITECTURE_QUESTIONS).slice(0, 3);

  // Enrich each question with repo-specific context
  const questions = [...pickedLang, ...pickedArch].map((q, i) => ({
    id: i + 1,
    question: enrichQuestion(q.q, repo, userData, langKey),
    category: q.category,
    keywords: q.keywords,
    language: langKey,
    difficulty: i < 3 ? 'easy' : i < 6 ? 'medium' : 'hard',
    maxScore: 100,
  }));

  const context = {
    repoName: repo.name,
    repoDescription: repo.description,
    primaryLanguage: langKey,
    totalStars: repo.stargazers_count || 0,
    totalForks: repo.forks_count || 0,
    developerName: userData.name || userData.login,
    topics: repo.topics || [],
  };

  return { questions, context };
}

/**
 * Enrich a template question with repo-specific details.
 */
function enrichQuestion(template, repo, _userData, _lang) {
  let q = template;
  q = q.replace(/this repository/gi, `**${repo.name}**`);
  q = q.replace(/this codebase/gi, `**${repo.name}**`);
  q = q.replace(/this project/gi, `**${repo.name}**`);
  q = q.replace(/this application/gi, `**${repo.name}**`);

  // Add repo context hint
  const hints = [];
  if (repo.description) hints.push(`Repo description: "${repo.description}"`);
  if (repo.stargazers_count > 100) hints.push(`This repo has ${repo.stargazers_count} stars — a mature project.`);
  if (repo.forks_count > 50) hints.push(`Forked ${repo.forks_count} times — likely used by others.`);
  if (hints.length > 0) {
    q += `\n\n*Context: ${hints.join(' ')}*`;
  }
  return q;
}

/**
 * Score an answer against expected keywords and content heuristics.
 * @param {string} answer — user's text answer
 * @param {object} question — question object with keywords
 * @returns {{ score: number, matchedKeywords: string[], feedback: string }}
 */
export function scoreAnswer(answer, question) {
  if (!answer || answer.trim().length < 10) {
    return {
      score: 5,
      matchedKeywords: [],
      feedback: 'Your answer is too short. Provide a more detailed explanation.',
    };
  }

  const normalized = answer.toLowerCase();
  const matched = question.keywords.filter(kw =>
    normalized.includes(kw.toLowerCase())
  );

  // Base score from keyword match (0–70 pts)
  const keywordRatio = matched.length / question.keywords.length;
  let score = Math.round(keywordRatio * 70);

  // Length bonus (0–20 pts) — rewards thoroughness
  const words = answer.trim().split(/\s+/).length;
  if (words > 20) score += 5;
  if (words > 50) score += 5;
  if (words > 100) score += 5;
  if (words > 150) score += 5;

  // Structure bonus (0–10 pts) — paragraphs, examples, bullet points
  const hasParagraphs = answer.split('\n').filter(l => l.trim().length > 0).length >= 2;
  const hasExample = /example|e\.g\.|for instance|such as/i.test(answer);
  const hasComparison = /difference|compare|versus|unlike|whereas|while/i.test(answer);
  if (hasParagraphs) score += 3;
  if (hasExample) score += 4;
  if (hasComparison) score += 3;

  score = Math.min(100, Math.max(0, score));

  // Generate feedback
  let feedback = '';
  if (score >= 80) {
    feedback = 'Excellent answer! You demonstrated strong understanding with relevant keywords and good structure.';
  } else if (score >= 60) {
    feedback = `Good answer. You covered ${matched.length}/${question.keywords.length} key concepts. Try to include: ${question.keywords.filter(k => !matched.includes(k)).slice(0, 3).join(', ')}.`;
  } else if (score >= 35) {
    feedback = `Decent start, but missing key concepts. Consider covering: ${question.keywords.filter(k => !matched.includes(k)).slice(0, 4).join(', ')}.`;
  } else {
    feedback = `Needs improvement. A strong answer would reference concepts like: ${question.keywords.slice(0, 4).join(', ')}. Try to be more specific and technical.`;
  }

  return { score, matchedKeywords: matched, feedback };
}

/**
 * Calculate overall results from scored answers.
 * @param {Array} results — array of { question, score, matchedKeywords, feedback }
 * @returns {{ overallScore, categoryScores, grade, summary, strengths, weaknesses }}
 */
export function calculateResults(results) {
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const maxScore = results.length * 100;
  const overallScore = Math.round((totalScore / maxScore) * 100);

  // Category breakdown
  const categories = {};
  results.forEach(r => {
    const cat = r.question.category;
    if (!categories[cat]) categories[cat] = { total: 0, count: 0 };
    categories[cat].total += r.score;
    categories[cat].count += 1;
  });

  const categoryScores = {};
  for (const [cat, data] of Object.entries(categories)) {
    categoryScores[cat] = Math.round((data.total / (data.count * 100)) * 100);
  }

  // Grade
  const grade = getGrade(overallScore);

  // Strengths & weaknesses
  const sorted = [...results].sort((a, b) => b.score - a.score);
  const strengths = sorted.slice(0, 3).map(r => ({
    question: r.question.question.split('\n')[0],
    score: r.score,
    category: r.question.category,
  }));
  const weaknesses = sorted.slice(-3).reverse().map(r => ({
    question: r.question.question.split('\n')[0],
    score: r.score,
    category: r.question.category,
    missingKeywords: r.question.keywords.filter(kw => !r.matchedKeywords.includes(kw)).slice(0, 3),
  }));

  // Summary
  const summary = generateSummary(overallScore, categoryScores, strengths, weaknesses);

  return { overallScore, categoryScores, grade, summary, strengths, weaknesses };
}

// ── Helpers ──

function getTopLanguage(repo) {
  if (repo.language) return repo.language;
  if (repo.languages && typeof repo.languages === 'object') {
    const sorted = Object.entries(repo.languages).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'JavaScript';
  }
  return 'JavaScript';
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getGrade(score) {
  if (score >= 90) return { letter: 'A+', label: 'Outstanding', color: '#22c55e' };
  if (score >= 80) return { letter: 'A', label: 'Excellent', color: '#4ade80' };
  if (score >= 70) return { letter: 'B+', label: 'Very Good', color: '#3b82f6' };
  if (score >= 60) return { letter: 'B', label: 'Good', color: '#60a5fa' };
  if (score >= 50) return { letter: 'C+', label: 'Above Average', color: '#f59e0b' };
  if (score >= 40) return { letter: 'C', label: 'Average', color: '#f97316' };
  if (score >= 30) return { letter: 'D', label: 'Below Average', color: '#ef4444' };
  return { letter: 'F', label: 'Needs Improvement', color: '#dc2626' };
}

function generateSummary(score, categories, _strengths, _weaknesses) {
  const parts = [];

  if (score >= 80) {
    parts.push(`Outstanding performance! You scored ${score}/100, demonstrating strong technical knowledge.`);
  } else if (score >= 60) {
    parts.push(`Solid performance with a score of ${score}/100. You showed good understanding of core concepts.`);
  } else if (score >= 40) {
    parts.push(`A decent attempt at ${score}/100. There are clear areas for growth.`);
  } else {
    parts.push(`You scored ${score}/100 — this is a learning opportunity. Focus on the areas below.`);
  }

  const bestCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
  const worstCat = Object.entries(categories).sort((a, b) => a[1] - b[1])[0];

  if (bestCat) {
    parts.push(`Your strongest area is **${bestCat[0]}** (${bestCat[1]}%).`);
  }
  if (worstCat && worstCat[0] !== bestCat?.[0]) {
    parts.push(`Focus on improving your **${worstCat[0]}** knowledge (${worstCat[1]}%).`);
  }

  return parts.join(' ');
}
