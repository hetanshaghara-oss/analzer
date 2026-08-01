/**
 * Comparison Analyzer Engine
 * Compares multiple GitHub profiles side-by-side using heuristics.
 */

export const generateComparisonReport = (profilesDataArray) => {
  if (!profilesDataArray || profilesDataArray.length < 2) return null;

  const getRepoScore = (repos) => {
    let score = 0;
    repos.forEach(r => {
      score += r.stargazers_count * 2;
      score += r.forks_count * 3;
      if (r.has_pages) score += 5;
    });
    return score;
  };

  const getProfileAgeInDays = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    return (now - created) / (1000 * 60 * 60 * 24);
  };

  const calculateUserScore = (pd) => {
    const { profile, repos, stats } = pd;
    const ageDays = getProfileAgeInDays(profile.created_at);
    
    const technicalSkills = Math.min(100, Object.keys(stats.languages || {}).length * 10);
    const repoQuality = Math.min(100, getRepoScore(repos) / 10);
    const openSource = Math.min(100, (profile.public_repos * 1) + (profile.followers * 2));
    const documentation = Math.min(100, repos.filter(r => r.has_wiki).length * 15 + 40); // Rough heuristic

    const overall = (technicalSkills + repoQuality + openSource + documentation) / 4;
    return {
      technicalSkills: Math.round(technicalSkills),
      repoQuality: Math.round(repoQuality),
      openSource: Math.round(openSource),
      documentation: Math.round(documentation),
      overall: Math.round(overall)
    };
  };

  const generateInsights = (scores, users) => {
    let topOverall = null;
    let topRepos = null;
    let topOS = null;
    let maxOverall = -1;
    let maxRepos = -1;
    let maxOS = -1;

    users.forEach((u, i) => {
      const s = scores[i];
      if (s.overall > maxOverall) { maxOverall = s.overall; topOverall = u.profile.login; }
      if (s.repoQuality > maxRepos) { maxRepos = s.repoQuality; topRepos = u.profile.login; }
      if (s.openSource > maxOS) { maxOS = s.openSource; topOS = u.profile.login; }
    });

    return {
      strongestOverall: topOverall,
      bestRepositories: topRepos,
      strongestOpenSource: topOS,
      summary: `${topOverall} has the strongest overall profile. ${topRepos} shows exceptional repository quality, while ${topOS} excels in open-source contributions.`
    };
  };

  const buildSkillIntersection = () => {
    // Array of sets of languages for each user
    const userLangs = profilesDataArray.map(pd => new Set(Object.keys(pd.stats.languages || {})));
    
    // Intersection: items present in ALL sets
    let common = [];
    if (userLangs.length > 0) {
      common = [...userLangs[0]].filter(lang => 
        userLangs.every(set => set.has(lang))
      );
    }
    
    // Unique: items present in ONLY one set
    const allLangs = profilesDataArray.reduce((acc, pd) => acc.concat(Object.keys(pd.stats.languages || {})), []);
    const langCounts = allLangs.reduce((acc, lang) => {
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});
    
    const unique = Object.keys(langCounts).filter(lang => langCounts[lang] === 1);

    return { common, unique };
  };

  const projectShowdown = () => {
    return profilesDataArray.map(pd => {
      const repos = [...pd.repos];
      const mostStarred = repos.sort((a, b) => b.stargazers_count - a.stargazers_count)[0];
      const largest = repos.sort((a, b) => b.size - a.size)[0];
      return {
        username: pd.profile.login,
        mostStarred: mostStarred ? { name: mostStarred.name, stars: mostStarred.stargazers_count } : null,
        largest: largest ? { name: largest.name, size: largest.size } : null
      };
    });
  };

  const scores = profilesDataArray.map(pd => calculateUserScore(pd));

  return {
    scores,
    insights: generateInsights(scores, profilesDataArray),
    skills: buildSkillIntersection(),
    projects: projectShowdown(),
    suggestions: profilesDataArray.map((pd, i) => {
      const s = scores[i];
      let areas = [];
      if (s.documentation < 50) areas.push("Add more wikis and detailed READMEs.");
      if (s.openSource < 50) areas.push("Increase community engagement by contributing to public projects.");
      if (s.repoQuality < 50) areas.push("Focus on building highly requested projects to earn stars and forks.");
      if (areas.length === 0) areas.push("Keep up the excellent work!");
      return {
        username: pd.profile.login,
        areasToImprove: areas
      };
    })
  };
};
