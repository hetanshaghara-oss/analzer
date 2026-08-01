/**
 * Studio Builder Engine
 * Extracts skills, recommends projects, and prepares editable resume/portfolio templates.
 */

const SKILL_KEYWORDS = {
  frameworks: ['react', 'next.js', 'vue', 'angular', 'svelte', 'express', 'nest', 'django', 'flask', 'fastapi', 'spring boot', 'laravel', 'rails'],
  databases: ['postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'mariadb', 'cassandra', 'dynamodb', 'firebase', 'supabase'],
  devops: ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd', 'github actions', 'jenkins', 'terraform', 'ansible', 'nginx'],
  ml: ['tensorflow', 'pytorch', 'keras', 'scikit-learn', 'opencv', 'numpy', 'pandas', 'openai', 'llm', 'langchain']
};

export function generateInitialBuilderState(userData, stats, repos) {
  const extractedSkills = extractSkills(repos, stats.overview.topLanguage);
  const featuredProjects = extractFeaturedProjects(repos);

  return {
    personalInfo: {
      fullName: userData.name || userData.login,
      title: `${stats.overview.topLanguage !== 'N/A' ? stats.overview.topLanguage : 'Full-Stack'} Developer`,
      email: userData.email || '',
      location: userData.location || '',
      website: userData.blog || '',
      twitter: userData.twitter_username || '',
      github: userData.login,
      bio: userData.bio || 'Passionate software engineer building modern applications.',
    },
    skills: extractedSkills,
    projects: featuredProjects,
    experience: [
      {
        role: 'Senior Software Engineer',
        company: 'Freelance / Open Source Contributor',
        period: '2023 - Present',
        description: 'Designed and implemented various software systems. Contributed to repository maintenance, optimization, and documentation improvements.'
      },
      {
        role: 'Software Developer',
        company: 'Personal Projects Portfolio',
        period: '2021 - 2023',
        description: 'Developed full-stack web architectures, managed database pipelines, and integrated third-party REST APIs.'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        school: 'University of Technology',
        year: '2018 - 2022'
      }
    ],
    certifications: ['AWS Certified Developer', 'Google Cloud Engineer', 'Scrum Master Certification'],
    achievements: [
      `Contributed to ${stats.overview.totalRepos} repositories on GitHub.`,
      `Authored codebase in ${stats.overview.totalLanguagesUsed} programming languages.`,
      `Accumulated ${stats.overview.totalStars} stars across public projects.`
    ],
    sectionOrder: ['about', 'skills', 'stats', 'projects', 'experience', 'education']
  };
}

function extractSkills(repos, topLanguage) {
  const languages = new Set();
  const frameworks = new Set();
  const databases = new Set();
  const devops = new Set();
  const ml = new Set();

  if (topLanguage && topLanguage !== 'N/A') languages.add(topLanguage);

  repos.forEach(repo => {
    if (repo.language) languages.add(repo.language);

    const desc = (repo.description || '').toLowerCase();
    const topics = (repo.topics || []).map(t => t.toLowerCase());

    // Search keywords
    const searchString = `${desc} ${topics.join(' ')}`;

    SKILL_KEYWORDS.frameworks.forEach(fw => {
      if (searchString.includes(fw)) frameworks.add(capitalize(fw));
    });
    SKILL_KEYWORDS.databases.forEach(db => {
      if (searchString.includes(db)) databases.add(capitalize(db));
    });
    SKILL_KEYWORDS.devops.forEach(doTool => {
      if (searchString.includes(doTool)) devops.add(capitalize(doTool));
    });
    SKILL_KEYWORDS.ml.forEach(m => {
      if (searchString.includes(m)) ml.add(capitalize(m));
    });
  });

  return [
    { category: 'Languages', items: Array.from(languages) },
    { category: 'Frameworks & Libraries', items: Array.from(frameworks).slice(0, 8) },
    { category: 'Databases & Storage', items: Array.from(databases).slice(0, 6) },
    { category: 'Cloud & DevOps', items: Array.from(devops).slice(0, 6) },
    { category: 'AI/ML & Engineering', items: Array.from(ml).slice(0, 6) }
  ].filter(cat => cat.items.length > 0);
}

function extractFeaturedProjects(repos) {
  const scored = repos.map(repo => {
    let score = 0;
    score += repo.stargazers_count * 10;
    score += repo.forks_count * 5;
    score += repo.size > 1000 ? 10 : 0;
    if (repo.description) score += 15;
    if (repo.homepage) score += 15; // Deployed link
    if (repo.language) score += 10;

    return { repo, score };
  });

  // Sort descending and grab top 4
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ repo }) => ({
      name: repo.name,
      description: repo.description || 'Modern utility application.',
      url: repo.html_url,
      liveUrl: repo.homepage || '',
      language: repo.language || '',
      stars: repo.stargazers_count,
      forks: repo.forks_count
    }));
}

function capitalize(str) {
  if (str === 'gcp') return 'Google Cloud Platform (GCP)';
  if (str === 'aws') return 'Amazon Web Services (AWS)';
  if (str === 'ml') return 'Machine Learning';
  if (str === 'ci/cd') return 'CI/CD';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
