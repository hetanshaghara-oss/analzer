import React, { useState } from 'react';
import { Download, Copy, Check, Share2, Code2, FileText, Award, Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import Paywall from '../auth/Paywall';
import './ExportShare.css';

// Print styles for the report clone — mirrors the @media print block in ExportShare.css
// so html2pdf can render it while it's hidden on screen.
const PRINT_STYLES = `
  .ex-print { display:block !important; padding:40px; background:#fff; color:#000; }
  .print-header { display:flex; justify-content:space-between; align-items:flex-end; border-bottom:2px solid #000; padding-bottom:20px; margin-bottom:40px; }
  .print-header-left { display:flex; align-items:center; gap:20px; }
  .print-header-left h1 { font-size:32px; font-weight:900; margin:0 0 5px 0; color:#000; }
  .print-header-left p  { font-size:14px; color:#555; margin:0; }
  .print-header-right   { text-align:right; }
  .print-label          { font-size:12px; text-transform:uppercase; font-weight:bold; color:#888; margin:0 0 4px 0; }
  .print-date           { font-size:16px; font-weight:bold; color:#000; margin:0; }
  .print-stats-grid     { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-bottom:40px; }
  .print-stat-box       { border:1px solid #ccc; padding:20px; border-radius:8px; text-align:center; }
  .print-stat-box .print-label { font-size:12px; text-transform:uppercase; font-weight:bold; color:#888; margin:0 0 4px 0; }
  .print-value          { font-size:28px; font-weight:900; color:#000; margin:5px 0 0 0; }
  .print-disclaimer     { margin-top:60px; padding-top:20px; border-top:1px dashed #ccc; font-size:12px; color:#777; text-align:center; }
`;

const ExportShareTab = ({ userData, stats }) => {
  const [copiedBadgeIndex, setCopiedBadgeIndex] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [exporting, setExporting] = useState(false);

  const topLang = stats?.overview?.topLanguage || 'Developer';
  const stars = stats?.overview?.totalStars || 0;
  const repos = stats?.overview?.totalRepos || 0;
  const username = userData?.login || 'developer';

  const profileUrl = `${window.location.origin}/dashboard/${username}`;

  // Markdown README Badges
  const badges = [
    {
      title: 'GitInsight Developer Badge',
      img: `https://img.shields.io/badge/GitInsight-${encodeURIComponent(topLang)}%20Developer-6366f1?style=for-the-badge&logo=github`,
      markdown: `[![GitInsight Profile](https://img.shields.io/badge/GitInsight-${encodeURIComponent(topLang)}%20Developer-6366f1?style=for-the-badge&logo=github)](${profileUrl})`,
    },
    {
      title: 'Repository & Star Counter',
      img: `https://img.shields.io/badge/GitHub%20Stats-${repos}%20Repos%20%7C%20${stars}%20%E2%AD%90-22c55e?style=for-the-badge&logo=github`,
      markdown: `[![GitInsight Stats](https://img.shields.io/badge/GitHub%20Stats-${repos}%20Repos%20%7C%20${stars}%20%E2%AD%90-22c55e?style=for-the-badge&logo=github)](${profileUrl})`,
    },
    {
      title: 'Compact Profile Badge',
      img: `https://img.shields.io/badge/GitInsight.ai-${username}-8b5cf6?style=flat-square&logo=github`,
      markdown: `[![GitInsight](https://img.shields.io/badge/GitInsight.ai-${username}-8b5cf6?style=flat-square&logo=github)](${profileUrl})`,
    },
  ];

  const handleCopyBadge = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedBadgeIndex(index);
    setTimeout(() => setCopiedBadgeIndex(null), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadPDF = async () => {
    const source = document.querySelector('.ex-print');
    if (!source || exporting) return;
    setExporting(true);
    try {
      // Clone the hidden print report so we can force it visible without
      // affecting the live DOM, then hand the clone to html2pdf.
      const clone = source.cloneNode(true);
      clone.style.cssText =
        'display:block;background:#fff;color:#000;padding:40px;' +
        'width:794px;margin:0;box-sizing:border-box;position:absolute;left:-9999px;top:0;';
      const style = document.createElement('style');
      style.textContent = PRINT_STYLES;
      clone.prepend(style);
      document.body.appendChild(clone);

      const filename = `${userData?.login || 'developer'}_gitinsight_report.pdf`;
      await html2pdf()
        .set({
          margin: [8, 8, 8, 8],
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
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

  return (
    <Paywall required="pro">
      <div className="ex-container animate-fade-in">

      {/* ── Header ── */}
      <div className="ex-header no-print">
        <div className="ex-header-icon"><FileText size={26} /></div>
        <div>
          <h2>Export &amp; Share</h2>
          <p>Download a printable report or share your live dashboard with collaborators and recruiters.</p>
        </div>
      </div>

      {/* ── Main Actions Grid ── */}
      <div className="ex-actions no-print">

        {/* PDF Download Card */}
        <div className="ex-action">
          <div className="ex-action-top">
            <div className="ex-action-icon"><Download size={26} /></div>
            <div className="ex-action-text">
              <h3>Generate PDF Report</h3>
              <p>Export a clean, professional printable resume detailing your AI-analyzed GitHub statistics.</p>
            </div>
          </div>
          <button onClick={handleDownloadPDF} disabled={exporting} className="ex-btn ex-btn-primary">
            {exporting ? (
              <><Loader2 size={18} className="spin" /> Generating PDF…</>
            ) : (
              <><Download size={18} /> Download PDF</>
            )}
          </button>
        </div>

        {/* Share Link Card */}
        <div className="ex-action">
          <div className="ex-action-top">
            <div className="ex-action-icon"><Share2 size={26} /></div>
            <div className="ex-action-text">
              <h3>Share Live Dashboard</h3>
              <p>Copy your unique dashboard URL to share your interactive stats with collaborators or recruiters.</p>
            </div>
          </div>
          <button onClick={handleCopyLink} className="ex-btn ex-btn-secondary">
            {copiedLink ? <Check size={18} style={{ color: 'hsl(var(--color-green))' }} /> : <Copy size={18} />}
            {copiedLink ? 'Link Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* ── GitHub README Badges ── */}
      <div className="ex-badges no-print">
        <div className="ex-badges-head">
          <div className="ex-badges-head-icon"><Code2 size={26} /></div>
          <div className="ex-badges-head-text">
            <h3>Embed README Badges</h3>
            <p>Paste these markdown snippets directly into your GitHub profile README.md to show off your stats.</p>
          </div>
        </div>

        <div className="ex-badge-list">
          {badges.map((b, idx) => (
            <div key={idx} className="ex-badge-item">
              <div className="ex-badge-top">
                <span className="ex-badge-title">{b.title}</span>
                <span className="ex-badge-type">Markdown</span>
              </div>
              <div className="ex-badge-preview">
                <img src={b.img} alt={b.title} />
              </div>
              <div className="ex-code-row">
                <code>{b.markdown}</code>
                <button
                  onClick={() => handleCopyBadge(b.markdown, idx)}
                  className={`ex-copy-btn ${copiedBadgeIndex === idx ? 'copied' : ''}`}
                  title="Copy markdown"
                >
                  {copiedBadgeIndex === idx ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Printable Report (Only visible in PDF/Print) ── */}
      <div className="ex-print">
        <div className="print-header">
          <div className="print-header-left">
            <Award size={40} className="print-icon" />
            <div>
              <h1>{userData?.name || username}</h1>
              <p>GitInsight AI Technical Profile Report</p>
            </div>
          </div>
          <div className="print-header-right">
            <p className="print-label">Generated On</p>
            <p className="print-date">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="print-stats-grid">
          <div className="print-stat-box">
            <p className="print-label">Top Language</p>
            <p className="print-value">{topLang}</p>
          </div>
          <div className="print-stat-box">
            <p className="print-label">Total Stars</p>
            <p className="print-value">{stars}</p>
          </div>
          <div className="print-stat-box">
            <p className="print-label">Repositories</p>
            <p className="print-value">{repos}</p>
          </div>
          <div className="print-stat-box">
            <p className="print-label">Followers</p>
            <p className="print-value">{userData?.followers || 0}</p>
          </div>
        </div>

        <div className="print-disclaimer">
          <p>This report was generated automatically based on public GitHub repository data. For live interactive analytics, visit <strong>gitinsight.ai</strong></p>
        </div>
      </div>

      </div>
    </Paywall>
  );
};

export default ExportShareTab;
