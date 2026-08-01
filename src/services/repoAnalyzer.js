/**
 * AI Repository Analyzer - Heuristic Engine
 * Analyzes GitHub repository data and generates a professional review report.
 */

const SENSITIVE_FILES = ['.env', '.env.local', '.env.production', 'secrets.json', 'credentials.json', 'private_key.pem', '.pem', 'id_rsa', 'config.yml', 'database.yml'];
const GOOD_ROOT_FILES = ['readme', 'license', 'contributing', 'changelog', '.gitignore', 'package.json', 'dockerfile', 'makefile'];
const TEST_INDICATORS = ['test', 'spec', '__tests__', '.test.', '.spec.', 'jest', 'mocha', 'cypress'];
const CI_FILES = ['.github', '.travis.yml', '.circleci', 'jenkinsfile', '.gitlab-ci.yml', 'azure-pipelines.yml'];
const DOC_INDICATORS = ['docs', 'documentation', 'wiki', 'doc'];

export function generateRepoReport(repoData, fileTree, readmeContent, languages, contributors) {
  const scores = calculateScores(repoData, fileTree, readmeContent, languages);
  const readmeAnalysis = analyzeReadme(readmeContent, repoData.name);
  const structureAnalysis = analyzeStructure(fileTree, repoData);
  const securityFlags = analyzeSecurityFlags(fileTree, repoData);
  const performanceInsights = analyzePerformance(repoData, fileTree);
  const strengthsWeaknesses = deriveStrengthsWeaknesses(scores, readmeAnalysis, structureAnalysis, securityFlags);
  const recommendations = generateRecommendations(scores, readmeAnalysis, structureAnalysis, securityFlags);
  const finalVerdict = generateVerdict(scores.overall, repoData);

  return {
    summary: generateProjectSummary(repoData, languages, contributors, fileTree),
    scores,
    readmeAnalysis,
    structureAnalysis,
    securityFlags,
    performanceInsights,
    strengths: strengthsWeaknesses.strengths,
    weaknesses: strengthsWeaknesses.weaknesses,
    recommendations,
    finalVerdict,
  };
}

function calculateScores(repoData, fileTree, readmeContent, languages) {
  const fileNames = fileTree.map(f => f.name.toLowerCase());
  
  // Code Quality: based on presence of tests, CI, and non-trivial size
  const hasTests = fileNames.some(f => TEST_INDICATORS.some(t => f.includes(t)));
  const hasCI = fileNames.some(f => CI_FILES.some(c => f.includes(c)));
  let codeQuality = 50;
  if (hasTests) codeQuality += 20;
  if (hasCI) codeQuality += 10;
  if (repoData.size > 100) codeQuality += 10;
  if (Object.keys(languages).length > 1) codeQuality += 10;
  codeQuality = Math.min(100, codeQuality);

  // Documentation: README presence and length
  let documentation = 30;
  if (readmeContent) {
    documentation += Math.min(40, Math.floor(readmeContent.length / 200));
    if (readmeContent.includes('## Installation') || readmeContent.includes('## Setup')) documentation += 10;
    if (readmeContent.includes('## Usage') || readmeContent.includes('## Examples')) documentation += 10;
    if (readmeContent.includes('## License')) documentation += 5;
    if (readmeContent.includes('## Contributing')) documentation += 5;
  }
  const hasDocsDir = fileNames.some(f => DOC_INDICATORS.some(d => f.includes(d)));
  if (hasDocsDir) documentation += 10;
  documentation = Math.min(100, documentation);

  // Security: penalty for sensitive files, reward for .gitignore
  let security = 85;
  const hasSensitiveFiles = fileNames.some(f => SENSITIVE_FILES.some(s => f.endsWith(s) || f === s));
  const hasGitignore = fileNames.includes('.gitignore');
  const hasLicense = fileNames.some(f => f.includes('license'));
  if (hasSensitiveFiles) security -= 35;
  if (!hasGitignore) security -= 10;
  if (hasLicense) security += 5;
  security = Math.max(20, Math.min(100, security));

  // Performance: based on size and structure
  let performance = 70;
  if (repoData.size < 500) performance += 15;
  else if (repoData.size > 50000) performance -= 15;
  const hasLargeFiles = fileNames.some(f => f.endsWith('.jpg') || f.endsWith('.mp4') || f.endsWith('.zip'));
  if (hasLargeFiles) performance -= 10;
  performance = Math.max(30, Math.min(100, performance));

  // Architecture: folder organization, modularity
  let architecture = 50;
  const hasSrcDir = fileNames.includes('src');
  const hasTestDir = fileNames.some(f => f === 'test' || f === 'tests' || f === '__tests__');
  const hasComponentDir = fileNames.some(f => f === 'components' || f === 'modules' || f === 'lib');
  if (hasSrcDir) architecture += 20;
  if (hasTestDir) architecture += 15;
  if (hasComponentDir) architecture += 15;
  architecture = Math.min(100, architecture);

  // Maintainability: combination
  let maintainability = Math.round((codeQuality * 0.3) + (documentation * 0.25) + (architecture * 0.25) + (security * 0.2));

  const overall = Math.round((codeQuality + documentation + security + performance + architecture + maintainability) / 6);

  return {
    overall,
    categories: [
      { label: 'Code Quality', value: codeQuality, color: 'text-blue' },
      { label: 'Documentation', value: documentation, color: 'text-green' },
      { label: 'Security', value: security, color: 'text-red' },
      { label: 'Performance', value: performance, color: 'text-yellow' },
      { label: 'Architecture', value: architecture, color: 'text-purple' },
      { label: 'Maintainability', value: maintainability, color: 'text-orange' },
    ]
  };
}

function analyzeReadme(readmeContent, repoName) {
  if (!readmeContent) {
    return {
      hasReadme: false,
      completeness: 0,
      sections: [],
      missingSections: ['Title & Description', 'Installation', 'Usage', 'License', 'Contributing'],
      suggestions: ['Create a README.md file — it\'s the first thing visitors see.'],
    };
  }

  const content = readmeContent.toLowerCase();
  const checklist = [
    { key: 'Title', found: content.includes(repoName.toLowerCase()) || content.startsWith('#') },
    { key: 'Description', found: content.length > 200 },
    { key: 'Installation', found: content.includes('install') || content.includes('setup') || content.includes('getting started') },
    { key: 'Usage', found: content.includes('usage') || content.includes('example') || content.includes('how to') },
    { key: 'Screenshots/Demo', found: content.includes('![') || content.includes('demo') || content.includes('screenshot') },
    { key: 'License', found: content.includes('license') },
    { key: 'Contributing', found: content.includes('contribut') },
    { key: 'Badges', found: content.includes('[![') || content.includes('badge') },
  ];

  const found = checklist.filter(c => c.found);
  const missing = checklist.filter(c => !c.found);
  const completeness = Math.round((found.length / checklist.length) * 100);

  const suggestions = missing.slice(0, 3).map(m => `Add a "${m.key}" section to your README.`);

  return {
    hasReadme: true,
    completeness,
    sections: found.map(c => c.key),
    missingSections: missing.map(c => c.key),
    suggestions,
  };
}

function analyzeStructure(fileTree, repoData) {
  const fileNames = fileTree.map(f => f.name.toLowerCase());
  const folders = fileTree.filter(f => f.type === 'dir').map(f => f.name);
  const files = fileTree.filter(f => f.type === 'file').map(f => f.name);

  const patterns = [
    { key: 'Source directory (src/)', found: fileNames.includes('src'), good: true },
    { key: 'Test directory', found: fileNames.some(f => ['test', 'tests', '__tests__', 'spec'].includes(f)), good: true },
    { key: 'Documentation folder', found: fileNames.some(f => DOC_INDICATORS.includes(f)), good: true },
    { key: '.gitignore present', found: fileNames.includes('.gitignore'), good: true },
    { key: 'License file', found: fileNames.some(f => f.startsWith('license')), good: true },
    { key: 'CI/CD configuration', found: fileNames.some(f => CI_FILES.some(c => f.includes(c))), good: true },
    { key: 'Package configuration', found: fileNames.some(f => ['package.json', 'requirements.txt', 'cargo.toml', 'go.mod', 'pom.xml'].includes(f)), good: true },
    { key: 'Dockerfile', found: fileNames.some(f => f.includes('dockerfile')), good: false },
  ];

  const goodPatterns = patterns.filter(p => p.found && p.good);
  const missingPatterns = patterns.filter(p => !p.found && p.good);

  return {
    totalRootFiles: files.length,
    totalRootFolders: folders.length,
    folders,
    goodPatterns,
    missingPatterns,
    organizationScore: Math.round((goodPatterns.length / patterns.filter(p => p.good).length) * 100),
  };
}

function analyzeSecurityFlags(fileTree, repoData) {
  const fileNames = fileTree.map(f => f.name.toLowerCase());

  const flags = [
    { label: 'No exposed .env files in root', safe: !fileNames.some(f => f === '.env' || f === '.env.local' || f === '.env.production') },
    { label: 'No hardcoded secrets files detected', safe: !fileNames.some(f => f === 'secrets.json' || f === 'credentials.json' || f.endsWith('.pem') || f === 'id_rsa') },
    { label: '.gitignore present (protects sensitive files)', safe: fileNames.includes('.gitignore') },
    { label: 'License file present', safe: fileNames.some(f => f.startsWith('license')) },
    { label: 'No binary/executable files in root', safe: !fileNames.some(f => f.endsWith('.exe') || f.endsWith('.dll') || f.endsWith('.so')) },
    { label: 'Repository is not archived', safe: !repoData.archived },
  ];

  return flags;
}

function analyzePerformance(repoData, fileTree) {
  const insights = [];

  if (repoData.size > 50000) insights.push({ type: 'warning', text: `Repository is very large (${(repoData.size / 1024).toFixed(1)} MB). Consider using Git LFS for large assets.` });
  else if (repoData.size < 1000) insights.push({ type: 'good', text: 'Lightweight repository size — great for fast cloning.' });
  else insights.push({ type: 'info', text: `Repository size is ${(repoData.size / 1024).toFixed(1)} MB — within acceptable range.` });

  const hasImages = fileTree.some(f => /\.(jpg|jpeg|png|gif|bmp|svg)$/i.test(f.name));
  if (hasImages) insights.push({ type: 'info', text: 'Image assets detected in root. Consider organizing into an assets/ directory.' });

  if (repoData.open_issues_count > 50) insights.push({ type: 'warning', text: `${repoData.open_issues_count} open issues detected. Addressing backlog improves project health.` });
  else if (repoData.open_issues_count === 0) insights.push({ type: 'good', text: 'No open issues — well-maintained project!' });

  const hasCI = fileTree.some(f => f.name === '.github' || f.name.toLowerCase().includes('travis') || f.name.toLowerCase().includes('circleci'));
  if (hasCI) insights.push({ type: 'good', text: 'CI/CD pipeline detected — automated testing improves reliability.' });
  else insights.push({ type: 'warning', text: 'No CI/CD configuration found. Automated pipelines improve code quality.' });

  return insights;
}

function deriveStrengthsWeaknesses(scores, readmeAnalysis, structureAnalysis, securityFlags) {
  const strengths = [];
  const weaknesses = [];

  if (scores.categories.find(c => c.label === 'Code Quality').value >= 70) strengths.push('Strong code quality with testing or CI/CD setup.');
  if (scores.categories.find(c => c.label === 'Documentation').value >= 70) strengths.push('Well-documented project with comprehensive README.');
  if (scores.categories.find(c => c.label === 'Security').value >= 80) strengths.push('Good security hygiene with no exposed credentials.');
  if (scores.categories.find(c => c.label === 'Architecture').value >= 70) strengths.push('Clear and organized project structure.');
  if (readmeAnalysis.completeness >= 75) strengths.push('README covers most essential sections effectively.');
  if (securityFlags.filter(f => f.safe).length >= 5) strengths.push('Passes most standard security checks.');

  if (scores.categories.find(c => c.label === 'Documentation').value < 50) weaknesses.push('README is incomplete or missing key sections.');
  if (scores.categories.find(c => c.label === 'Code Quality').value < 60) weaknesses.push('No tests or CI/CD configuration detected.');
  if (scores.categories.find(c => c.label === 'Security').value < 70) weaknesses.push('Potential security risks detected in repository root.');
  if (scores.categories.find(c => c.label === 'Architecture').value < 55) weaknesses.push('Project structure could be improved with better organization.');

  if (strengths.length === 0) strengths.push('Repository has a public presence and is accessible for collaboration.');
  if (weaknesses.length === 0) weaknesses.push('Minor improvements could further polish an already solid project.');

  return { strengths: strengths.slice(0, 4), weaknesses: weaknesses.slice(0, 4) };
}

function generateRecommendations(scores, readmeAnalysis, structureAnalysis, securityFlags) {
  const recs = [];

  if (readmeAnalysis.missingSections.length > 0) {
    recs.push(`Add missing README sections: ${readmeAnalysis.missingSections.slice(0, 3).join(', ')}.`);
  }
  if (structureAnalysis.missingPatterns.length > 0) {
    recs.push(`Add these structural elements: ${structureAnalysis.missingPatterns.slice(0, 2).map(p => p.key).join(', ')}.`);
  }
  if (scores.categories.find(c => c.label === 'Code Quality').value < 70) {
    recs.push('Add unit tests and configure a CI/CD pipeline (e.g., GitHub Actions).');
  }
  if (securityFlags.some(f => !f.safe)) {
    recs.push('Review security flags — ensure no secrets or credentials are committed to the repo.');
  }
  recs.push('Add project screenshots or a live demo link to attract contributors.');
  recs.push('Pin this repository on your GitHub profile if it represents your best work.');

  return recs.slice(0, 5);
}

function generateVerdict(overall, repoData) {
  let grade, label, description;
  if (overall >= 85) { grade = 'A'; label = 'Excellent'; description = 'This is a well-crafted, professional repository that demonstrates strong development practices.'; }
  else if (overall >= 70) { grade = 'B'; label = 'Good'; description = 'A solid repository with good foundations. A few improvements would make it exceptional.'; }
  else if (overall >= 55) { grade = 'C'; label = 'Average'; description = 'The repository has potential but needs attention in documentation, structure, and testing.'; }
  else { grade = 'D'; label = 'Needs Work'; description = 'Significant improvements are needed across documentation, structure, and code quality.'; }

  return { grade, label, description };
}

function generateProjectSummary(repoData, languages, contributors, fileTree) {
  const langList = Object.keys(languages).slice(0, 3).join(', ') || repoData.language || 'Unknown';
  const age = Math.floor((new Date() - new Date(repoData.created_at)) / (1000 * 60 * 60 * 24 * 365));
  const fileCount = fileTree.length;
  const contributorCount = contributors.length;
  const complexity = repoData.size > 10000 ? 'High' : repoData.size > 1000 ? 'Medium' : 'Low';

  return {
    overview: repoData.description || `${repoData.name} is a ${langList} project by ${repoData.owner?.login}.`,
    purpose: repoData.description ? `The project's stated purpose is: "${repoData.description}"` : 'No description provided — consider adding one to communicate your project\'s purpose.',
    techStack: langList,
    complexity,
    ageYears: age,
    rootFileCount: fileCount,
    contributorCount,
    topics: repoData.topics || [],
  };
}
