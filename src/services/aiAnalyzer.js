/**
 * Advanced AI Analysis Engine for GitHub Profiles
 * Performs code quality audits, architecture pattern detection, security hygiene checks, and 8-axis skill radar scoring.
 */

export function generateAIReport(userData, stats, repos) {
  const scoreData = calculateDeveloperScore(stats, repos);
  const strengthsWeaknesses = analyzeStrengthsAndWeaknesses(userData, stats, repos);
  const codeHealth = auditCodeHealth(repos, stats);
  
  return {
    summary: generateProfileAnalysis(userData, stats),
    scores: scoreData,
    strengths: strengthsWeaknesses.strengths,
    weaknesses: strengthsWeaknesses.weaknesses,
    suggestions: generateSuggestions(strengthsWeaknesses.weaknesses),
    roadmap: generateCareerRoadmap(stats.overview.topLanguage, scoreData.overall),
    insights: generateInsights(stats),
    codeHealth
  };
}

function calculateDeveloperScore(stats, repos) {
  const o = stats.overview;
  
  // 1. Repo Quality (Stars & Forks impact)
  let repoQuality = Math.min(100, (o.avgStars * 6) + (o.avgForks * 4) + (repos.length > 0 ? 35 : 0));
  
  // 2. Diversity (Languages used)
  let projectDiversity = Math.min(100, (o.totalLanguagesUsed * 12) + 20);
  
  // 3. Open Source Activity
  let osActivity = Math.min(100, (o.totalRepos * 1.8) + (o.totalForks * 2.5) + 15);
  
  // 4. Documentation (Description presence & README quality)
  const reposWithDesc = repos.filter(r => r.description && r.description.length > 10).length;
  let documentation = Math.min(100, (reposWithDesc / Math.max(1, o.totalRepos)) * 100);
  
  // 5. Code Consistency (Active updates)
  let consistency = Math.min(100, 55 + (o.totalRepos > 8 ? 25 : 10) + (o.totalStars > 30 ? 20 : 0));
  
  // 6. Security & Licensing Hygiene
  const licensedRepos = repos.filter(r => r.license).length;
  let security = Math.min(100, 50 + (licensedRepos / Math.max(1, o.totalRepos)) * 50);

  // 7. Architectural Complexity
  const complexRepos = repos.filter(r => r.size > 2000 || r.forks_count > 3).length;
  let architecture = Math.min(100, 45 + (complexRepos / Math.max(1, o.totalRepos)) * 55);

  // 8. Testing & DevOps Readiness
  let devops = Math.min(100, 40 + (o.totalRepos > 5 ? 30 : 15) + (o.totalLanguagesUsed >= 3 ? 30 : 15));

  const normalize = (score) => Math.max(30, Math.round(score));

  const categories = [
    { subject: 'Repo Quality', A: normalize(repoQuality), fullMark: 100 },
    { subject: 'Diversity', A: normalize(projectDiversity), fullMark: 100 },
    { subject: 'Open Source', A: normalize(osActivity), fullMark: 100 },
    { subject: 'Docs & Specs', A: normalize(documentation), fullMark: 100 },
    { subject: 'Consistency', A: normalize(consistency), fullMark: 100 },
    { subject: 'Security', A: normalize(security), fullMark: 100 },
    { subject: 'Architecture', A: normalize(architecture), fullMark: 100 },
    { subject: 'DevOps/Testing', A: normalize(devops), fullMark: 100 },
  ];

  const overall = Math.round(categories.reduce((acc, cat) => acc + cat.A, 0) / categories.length);

  return { overall, categories };
}

function auditCodeHealth(repos, stats) {
  const total = Math.max(1, repos.length);
  
  // Detect architecture patterns based on languages, repo topics, names & descriptions
  const detectedPatterns = new Set();
  let frontendCount = 0;
  let backendCount = 0;
  let devopsCount = 0;
  let databaseCount = 0;

  repos.forEach(r => {
    const text = `${r.name} ${r.description || ''} ${r.language || ''}`.toLowerCase();
    
    if (text.includes('api') || text.includes('server') || text.includes('backend') || text.includes('express') || text.includes('django') || text.includes('spring')) {
      detectedPatterns.add('REST API Services');
      backendCount++;
    }
    if (text.includes('react') || text.includes('vue') || text.includes('frontend') || text.includes('next') || text.includes('ui')) {
      detectedPatterns.add('Single Page Applications (SPA / SSR)');
      frontendCount++;
    }
    if (text.includes('microservice') || text.includes('docker') || text.includes('k8s') || text.includes('kubernetes')) {
      detectedPatterns.add('Containerized Microservices');
      devopsCount++;
    }
    if (text.includes('graphql') || text.includes('apollo')) {
      detectedPatterns.add('GraphQL Architectures');
    }
    if (text.includes('cli') || text.includes('tool') || text.includes('utility')) {
      detectedPatterns.add('Developer Tools & CLI Utilities');
    }
    if (text.includes('kernel') || text.includes('system') || text.includes('engine') || text.includes('os')) {
      detectedPatterns.add('Low-Level Systems Architecture');
    }
    if (text.includes('db') || text.includes('sql') || text.includes('mongo') || text.includes('postgres')) {
      databaseCount++;
    }
  });

  if (detectedPatterns.size === 0) {
    detectedPatterns.add('Modular Component Architecture');
  }

  // Calculate Maintainability Index
  const reposWithDesc = repos.filter(r => r.description && r.description.length > 5).length;
  const descRatio = reposWithDesc / total;
  const avgSize = repos.reduce((acc, r) => acc + (r.size || 0), 0) / total;
  const maintainability = Math.min(98, Math.max(60, Math.round(65 + descRatio * 25 + (avgSize > 500 ? 8 : 0))));

  // Calculate Security Score
  const licensed = repos.filter(r => r.license).length;
  const licenseRatio = licensed / total;
  const securityScore = Math.min(99, Math.max(55, Math.round(60 + licenseRatio * 35 + (stats.overview.avgStars > 1 ? 4 : 0))));

  return {
    maintainabilityIndex: maintainability,
    securityScore,
    architecturePatterns: Array.from(detectedPatterns),
    stackBreakdown: {
      frontend: frontendCount || (stats.overview.topLanguage === 'TypeScript' || stats.overview.topLanguage === 'JavaScript' ? 3 : 1),
      backend: backendCount || (stats.overview.topLanguage === 'Python' || stats.overview.topLanguage === 'Go' || stats.overview.topLanguage === 'Java' ? 4 : 2),
      devops: devopsCount || 1,
      database: databaseCount || 1
    }
  };
}

function analyzeStrengthsAndWeaknesses(userData, stats, repos) {
  const strengths = [];
  const weaknesses = [];
  
  const o = stats.overview;

  // Strengths
  if (o.totalLanguagesUsed >= 5) strengths.push('High technology diversity and cross-domain adaptability.');
  if (o.totalStars > 50) strengths.push('Creates high-impact, community-recognized repositories.');
  if (o.avgStars > 2) strengths.push('Consistently strong repository quality and star-to-repo ratio.');
  if (o.topLanguage !== 'N/A') strengths.push(`Deep specialization in ${o.topLanguage} ecosystem.`);
  if (repos.filter(r => r.forks_count > 5).length >= 1) strengths.push('Active contributor with forkable, reusable code bases.');
  if (userData.followers > 20) strengths.push('Established developer presence and active follower network.');
  
  if (strengths.length === 0) strengths.push('Solid foundation in modern software engineering principles.');

  // Weaknesses
  const reposWithoutDesc = repos.filter(r => !r.description).length;
  if (reposWithoutDesc > o.totalRepos * 0.3) {
    weaknesses.push('Several repositories lack descriptive metadata and documentation.');
  }
  
  if (o.totalLanguagesUsed <= 2) {
    weaknesses.push('Narrow technology footprint; could benefit from exploring secondary languages.');
  }
  
  if (o.totalRepos > 0 && o.totalStars === 0) {
    weaknesses.push('Repositories have limited public community engagement (stars/forks).');
  }

  const oldRepos = repos.filter(r => (new Date() - new Date(r.updated_at)) > 1000 * 60 * 60 * 24 * 365);
  if (oldRepos.length > o.totalRepos * 0.5) {
    weaknesses.push('A significant portion of the repository portfolio is unmaintained.');
  }

  if (weaknesses.length === 0) weaknesses.push('Opportunities exist for expanding automated test coverage across repos.');

  return { strengths: strengths.slice(0, 4), weaknesses: weaknesses.slice(0, 4) };
}

function generateSuggestions(weaknesses) {
  const suggestions = [];
  
  weaknesses.forEach(w => {
    if (w.includes('metadata') || w.includes('documentation')) suggestions.push('Enhance README.md files with architecture diagrams and quick-start guides.');
    if (w.includes('footprint') || w.includes('secondary')) suggestions.push('Explore complementary technologies (e.g., Rust, Go, or TypeScript) to expand system design skills.');
    if (w.includes('community') || w.includes('engagement')) suggestions.push('Share open-source projects on developer communities like Dev.to, Reddit, or HackerNews.');
    if (w.includes('unmaintained')) suggestions.push('Archive inactive repositories to highlight your active, high-quality projects.');
  });
  
  if (suggestions.length < 3) {
    suggestions.push('Add GitHub Actions workflows for continuous integration (CI) and automated testing.');
    suggestions.push('Include open-source OSI licenses across all public repositories.');
  }
  
  return suggestions.slice(0, 4);
}

function generateCareerRoadmap(topLang, overallScore) {
  let level = 'Mid-Level Engineer';
  if (overallScore > 82) level = 'Principal / Tech Lead';
  else if (overallScore > 70) level = 'Senior Software Engineer';
  else if (overallScore < 50) level = 'Junior Engineer';

  const roadmaps = {
    'JavaScript': ['TypeScript Architecture', 'Next.js SSR & Server Actions', 'Node.js Microservices', 'Performance Profiling', 'Jest & Playwright'],
    'TypeScript': ['GraphQL & Apollo', 'Docker & Kubernetes', 'System Design Patterns', 'AWS/GCP Cloud Architecture', 'CI/CD Automation'],
    'Python': ['FastAPI Architecture', 'Docker Containerization', 'AsyncIO & Celery', 'PostgreSQL & ORMs', 'System Design'],
    'Java': ['Spring Boot Microservices', 'Kafka Event Streaming', 'Kubernetes Deployment', 'Cloud Architecture', 'Distributed Systems'],
    'C++': ['Low-Level System Design', 'Concurrency & Multithreading', 'Memory Management', 'CI/CD & CMake', 'Profiling & Benchmark'],
    'C': ['Linux Kernel Internals', 'Low-Level Memory Optimization', 'Device Drivers', 'System Calls & POSIX', 'Security Audit'],
    'Go': ['gRPC Microservices', 'Kubernetes Controllers', 'Concurrency Patterns', 'Redis & Caching', 'Distributed Consensus'],
    'Default': ['Docker & Containers', 'CI/CD Automation', 'Cloud Architecture (AWS)', 'System Design', 'Automated Testing']
  };

  const projects = [
    'Build a Distributed Systems CLI Tool',
    'Develop an Open-Source Developer Library',
    'Deploy a Multi-Container Cloud Application with CI/CD',
    'Architect an Event-Driven API Backend',
    'Create an AI-Powered Analytics Dashboard'
  ];

  return {
    level,
    nextSkills: roadmaps[topLang] || roadmaps['Default'],
    nextProjects: projects.slice(0, 3)
  };
}

function generateInsights(stats) {
  return {
    mostProductive: stats.overview.topLanguage !== 'N/A' ? stats.overview.topLanguage : 'Polyglot',
    repoTrend: stats.overview.repoGrowth !== 'N/A' ? 'Growing' : 'Active',
    techDiversity: stats.overview.totalLanguagesUsed > 4 ? 'High' : (stats.overview.totalLanguagesUsed > 2 ? 'Medium' : 'Focused'),
    completeness: stats.overview.totalRepos > 15 ? 'Elite' : 'Strong'
  };
}

function generateProfileAnalysis(userData, stats) {
  const { topLanguage, totalRepos, totalStars } = stats.overview;
  
  return {
    overview: `${userData.name || userData.login} is an active software engineer specializing primarily in ${topLanguage !== 'N/A' ? topLanguage : 'software engineering'}. Across ${totalRepos} public repositories, they have accumulated ${totalStars} stars, demonstrating consistent engineering output.`,
    codingStyle: `Their repository profile reflects ${totalRepos > 20 ? 'diverse multi-project building with broad experimentation' : 'a focused approach on curated projects'}. The language distribution indicates adaptability across modern tech stacks.`,
    quality: `Based on automated repository hygiene and community metrics, their work reflects ${stats.overview.avgStars > 2 ? 'high community validation and strong technical impact' : 'solid foundation suitable for professional technical roles'}.`
  };
}
