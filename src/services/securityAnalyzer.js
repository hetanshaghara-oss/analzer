/**
 * Security & Vulnerability Analysis Engine for GitHub Repositories
 * Performs license audits, secret exposure risk checks, documentation checks, and stale project detection.
 */

export function analyzeSecurityProfile(repos) {
  const totalRepos = Math.max(1, repos.length);

  // 1. License Compliance Audit
  const licensedRepos = repos.filter(r => r.license && r.license.key !== 'other');
  const missingLicenseRepos = repos.filter(r => !r.license);
  const licenseComplianceRate = Math.round((licensedRepos.length / totalRepos) * 100);

  // 2. Documentation & Hygiene Audit (README & Description)
  const documentedRepos = repos.filter(r => r.description && r.description.trim().length > 10);
  const undocumentedRepos = repos.filter(r => !r.description || r.description.trim().length <= 10);
  const documentationRate = Math.round((documentedRepos.length / totalRepos) * 100);

  // 3. Stale / Abandoned Repositories Check (Not updated in > 1 year)
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const staleRepos = repos.filter(r => new Date(r.updated_at) < oneYearAgo);
  const activeRepos = repos.filter(r => new Date(r.updated_at) >= oneYearAgo);

  // 4. Secret Exposure Risk Assessment (Heuristic check on names & descriptions)
  const riskyKeywords = ['secret', 'token', 'key', 'password', 'cred', 'auth', 'private', 'env', 'config'];
  const potentialRiskyRepos = repos.filter(r => {
    const text = `${r.name} ${r.description || ''}`.toLowerCase();
    return riskyKeywords.some(kw => text.includes(kw));
  });

  // Calculate Overall Security Score (0 to 100)
  let score = 70; // Base score
  if (licenseComplianceRate > 80) score += 15;
  else if (licenseComplianceRate > 40) score += 8;

  if (documentationRate > 70) score += 10;

  if (staleRepos.length / totalRepos > 0.5) score -= 10;
  if (potentialRiskyRepos.length > 0) score -= 5 * potentialRiskyRepos.length;

  const finalScore = Math.max(40, Math.min(99, Math.round(score)));

  // Risk Rating Level
  let riskLevel = 'Low Risk';
  let badgeColor = 'text-green bg-green/10 border-green/20';

  if (finalScore < 60) {
    riskLevel = 'Action Recommended';
    badgeColor = 'text-danger bg-danger/10 border-danger/20';
  } else if (finalScore < 80) {
    riskLevel = 'Moderate Risk';
    badgeColor = 'text-yellow bg-yellow/10 border-yellow/20';
  }

  // Security Recommendations
  const recommendations = [];

  if (missingLicenseRepos.length > 0) {
    recommendations.push({
      type: 'license',
      severity: 'Medium',
      title: 'Add Open Source OSI Licenses',
      description: `${missingLicenseRepos.length} repositories are missing an explicit open-source license. Adding MIT, Apache-2.0, or GPL licenses ensures legal clarity for open-source users.`
    });
  }

  if (staleRepos.length > 0) {
    recommendations.push({
      type: 'stale',
      severity: 'Low',
      title: 'Archive Unmaintained Repositories',
      description: `${staleRepos.length} repositories have not been updated in over a year. Consider archiving inactive repositories to reduce dependency security surface area.`
    });
  }

  if (undocumentedRepos.length > 0) {
    recommendations.push({
      type: 'docs',
      severity: 'Low',
      title: 'Add Repository Descriptions & Security Policy',
      description: `${undocumentedRepos.length} repositories lack descriptions or documentation. Adding README.md and SECURITY.md policies helps establish repository trust.`
    });
  }

  if (potentialRiskyRepos.length > 0) {
    recommendations.push({
      type: 'secret',
      severity: 'High',
      title: 'Audit Repository Secret Exposure',
      description: `${potentialRiskyRepos.length} repositories contain sensitive keywords in their title or description. Ensure no API tokens, environment secrets, or private keys are committed.`
    });
  }

  return {
    score: finalScore,
    riskLevel,
    badgeColor,
    totalScanned: repos.length,
    licenseComplianceRate,
    documentationRate,
    staleReposCount: staleRepos.length,
    activeReposCount: activeRepos.length,
    missingLicenseRepos,
    staleRepos,
    potentialRiskyRepos,
    recommendations
  };
}
