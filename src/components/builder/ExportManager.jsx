import React, { useState } from 'react';
import html2pdf from 'html2pdf.js';
import { Download, FileText, Loader2 } from 'lucide-react';

/* ══════════════════════════════════════
   ExportManager — handles PDF (resume)
   and HTML (portfolio) downloads.
   Uses html2pdf.js for a true binary PDF
   rather than the browser print dialog.
══════════════════════════════════════ */

const ExportManager = ({ data, themeClass, viewMode }) => {
  const [exporting, setExporting] = useState(false);

  /* ── Resume → PDF via html2pdf.js ── */
  const handleExportPDF = async () => {
    const source = document.querySelector('.resume-preview-frame');
    if (!source || exporting) return;

    setExporting(true);

    try {
      // Clone the resume so we can mutate styles without affecting the live DOM
      const clone = source.cloneNode(true);
      clone.style.cssText =
        'background:#fff;color:#111;font-family:Inter,sans-serif;' +
        'padding:40px;width:794px;margin:0;box-sizing:border-box;' +
        'position:absolute;left:-9999px;top:0;';
      document.body.appendChild(clone);

      // Inject page-break helpers directly into the clone
      const style = document.createElement('style');
      style.textContent = `
        .resume-section { break-inside: avoid; page-break-inside: avoid; }
        .resume-header  { break-after: avoid; page-break-after: avoid; }
        .resume-preview-frame { box-shadow: none !important; }
      `;
      clone.prepend(style);

      const filename = `${data.personalInfo.github || 'developer'}_resume.pdf`;

      await html2pdf()
        .set({
          margin:       [10, 10, 10, 10],
          filename,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] },
        })
        .from(clone)
        .save();

      document.body.removeChild(clone);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  /* ── Portfolio → standalone HTML file ── */
  const handleDownloadHTML = () => {
    const htmlContent = compileHTML(data, themeClass);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.personalInfo.github}_portfolio.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-4 print-hide">
      {viewMode === 'resume' ? (
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="btn-primary flex items-center gap-2"
        >
          {exporting ? (
            <><Loader2 size={16} className="animate-spin" /> Generating PDF…</>
          ) : (
            <><FileText size={16} /> Export PDF</>
          )}
        </button>
      ) : (
        <button
          onClick={handleDownloadHTML}
          className="btn-primary flex items-center gap-2 bg-green hover:bg-green-600"
        >
          <Download size={16} /> Download HTML Portfolio
        </button>
      )}
    </div>
  );
};

// Simple HTML compiler for standalone portfolio downloads
function compileHTML(data, themeClass) {
  const { personalInfo, skills, projects, experience, education, achievements, sectionOrder } = data;

  const themeVariables = {
    'theme-sleek-dark': `
      --port-bg: #0f172a;
      --port-card-bg: #1e293b;
      --port-border: #334155;
      --port-text-main: #f8fafc;
      --port-text-sec: #94a3b8;
      --port-accent: #3b82f6;
    `,
    'theme-cyberpunk': `
      --port-bg: #0c0f12;
      --port-card-bg: #141a21;
      --port-border: #ff007f;
      --port-text-main: #00ffff;
      --port-text-sec: #8c9ba5;
      --port-accent: #ff007f;
    `,
    'theme-minimal-light': `
      --port-bg: #ffffff;
      --port-card-bg: #f8fafc;
      --port-border: #e2e8f0;
      --port-text-main: #0f172a;
      --port-text-sec: #475569;
      --port-accent: #0f172a;
    `
  };

  const activeThemeVars = themeVariables[themeClass] || themeVariables['theme-sleek-dark'];

  const sectionsHTML = sectionOrder.map(sectionId => {
    if (sectionId === 'about') {
      return `
        <section class="section" id="about">
          <h3 class="section-title">About Me</h3>
          <p>${personalInfo.bio}</p>
        </section>
      `;
    }
    if (sectionId === 'skills') {
      const skillsHTML = skills.map(g => `
        <div class="skills-category">
          <h4>${g.category}</h4>
          <div class="skills-tags">
            ${g.items.map(i => `<span class="skill-tag">${i}</span>`).join('')}
          </div>
        </div>
      `).join('');
      return `
        <section class="section" id="skills">
          <h3 class="section-title">Technical Expertise</h3>
          ${skillsHTML}
        </section>
      `;
    }
    if (sectionId === 'projects') {
      const projectsHTML = projects.map(p => `
        <div class="project-card">
          <div class="project-header">
            <h4>${p.name}</h4>
          </div>
          <p>${p.description}</p>
          <div class="project-footer">
            <span class="project-lang">${p.language}</span>
            <div class="project-links">
              <a href="${p.url}" target="_blank">GitHub</a>
              ${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank">Live Demo</a>` : ''}
            </div>
          </div>
        </div>
      `).join('');
      return `
        <section class="section" id="projects">
          <h3 class="section-title">Featured Projects</h3>
          <div class="projects-grid">${projectsHTML}</div>
        </section>
      `;
    }
    if (sectionId === 'experience') {
      const expHTML = experience.map(e => `
        <div class="experience-item">
          <div class="exp-header">
            <h4>${e.role}</h4>
            <span class="exp-period">${e.period}</span>
          </div>
          <div class="exp-company">${e.company}</div>
          <p>${e.description}</p>
        </div>
      `).join('');
      return `
        <section class="section" id="experience">
          <h3 class="section-title">Professional Journey</h3>
          <div class="experience-list">${expHTML}</div>
        </section>
      `;
    }
    if (sectionId === 'education') {
      const eduHTML = education.map(edu => `
        <div class="edu-item">
          <div class="edu-header">
            <h4>${edu.school}</h4>
            <span class="edu-year">${edu.year}</span>
          </div>
          <p>${edu.degree}</p>
        </div>
      `).join('');
      return `
        <section class="section" id="education">
          <h3 class="section-title">Education</h3>
          ${eduHTML}
        </section>
      `;
    }
    return '';
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${personalInfo.fullName} - Portfolio</title>
  <style>
    :root {
      ${activeThemeVars}
    }
    body {
      background-color: var(--port-bg);
      color: var(--port-text-main);
      font-family: sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 20px;
    }
    header {
      padding: 100px 20px 60px;
      text-align: center;
      border-bottom: 1px solid var(--port-border);
    }
    h1 { font-size: 3rem; margin: 0 0 10px; }
    .subtitle { font-size: 1.5rem; color: var(--port-text-sec); margin: 0 0 30px; }
    .btn {
      display: inline-block;
      padding: 10px 20px;
      background-color: var(--port-accent);
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    }
    .section {
      padding: 60px 20px;
      border-bottom: 1px solid var(--port-border);
    }
    .section-title {
      font-size: 2rem;
      margin-top: 0;
      color: var(--port-accent);
      text-transform: uppercase;
    }
    .skills-category { margin-bottom: 30px; }
    .skills-tags { display: flex; flex-wrap: wrap; gap: 10px; }
    .skill-tag {
      padding: 5px 12px;
      background-color: var(--port-card-bg);
      border: 1px solid var(--port-border);
      border-radius: 20px;
      color: var(--port-text-sec);
      font-size: 0.9rem;
    }
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
    }
    .project-card {
      background-color: var(--port-card-bg);
      border: 1px solid var(--port-border);
      border-radius: 10px;
      padding: 20px;
    }
    .project-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      font-size: 0.8rem;
    }
    .project-links a { color: var(--port-accent); text-decoration: none; margin-left: 10px; }
    .experience-item {
      position: relative;
      padding-left: 20px;
      border-left: 2px solid var(--port-border);
      margin-bottom: 30px;
    }
    .exp-header {
      display: flex;
      justify-content: space-between;
    }
    .exp-company { color: var(--port-text-sec); font-weight: bold; }
    footer {
      padding: 40px 20px;
      text-align: center;
      font-size: 0.8rem;
      color: var(--port-text-sec);
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>${personalInfo.fullName}</h1>
      <p class="subtitle">${personalInfo.title}</p>
      <a href="https://github.com/${personalInfo.github}" target="_blank" class="btn">GitHub Profile</a>
    </div>
  </header>
  <div class="container">
    ${sectionsHTML}
  </div>
  <footer>
    <p>Built automatically with GitInsight AI</p>
  </footer>
</body>
</html>
  `;
}

export default ExportManager;
