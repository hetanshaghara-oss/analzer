import React, { useEffect, useState } from 'react';
import Card from '../ui/Card';
import { buildRealHeatmapData } from '../../services/heatmapAnalyzer';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Flame, Calendar, Clock, Zap, RefreshCw, Info } from 'lucide-react';

// ─── Heatmap Cell ────────────────────────────────────────────────────────────
const HeatmapCell = ({ level, date, count }) => {
  const bgStyles = [
    { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' },
    { background: 'rgba(99,102,241,0.22)', border: '1px solid rgba(99,102,241,0.4)' },
    { background: 'rgba(99,102,241,0.50)', border: '1px solid rgba(99,102,241,0.65)' },
    { background: 'rgba(99,102,241,0.80)', border: 'none' },
    { background: '#6366f1', border: 'none', boxShadow: '0 0 6px rgba(99,102,241,0.85)' },
  ];
  return (
    <div
      className="w-3 h-3 rounded-sm transition-transform hover:scale-125 cursor-pointer shrink-0"
      style={bgStyles[level] || bgStyles[0]}
      title={`${date}: ${count} contribution${count !== 1 ? 's' : ''}`}
    />
  );
};

// ─── Month Labels ─────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getMonthLabels(weeks) {
  const labels = [];
  let lastMonth = -1;
  weeks.forEach((week, wIdx) => {
    if (!week || week.length === 0) return;
    const month = new Date(week[0].date).getMonth();
    if (month !== lastMonth) {
      labels.push({ idx: wIdx, label: MONTHS[month] });
      lastMonth = month;
    }
  });
  return labels;
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex flex-col items-center justify-center gap-4 py-20">
    <div className="w-10 h-10 border-4 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
    <p className="text-secondary text-sm">Fetching real commit data from GitHub…</p>
  </div>
);

// ─── No Data Banner ───────────────────────────────────────────────────────────
const NoDataBanner = ({ username }) => (
  <Card className="flex flex-col items-center justify-center gap-3 py-14 text-center">
    <Info size={36} className="text-accent-primary/60" />
    <h3 className="text-lg font-semibold">No public activity found</h3>
    <p className="text-secondary text-sm max-w-md">
      GitHub's public events API only exposes the last ~300 events. If{' '}
      <strong>@{username}</strong> has a private activity profile or hasn't committed
      recently, no data will appear here.
    </p>
  </Card>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const CommitHeatmapTab = ({ repoData, username }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await buildRealHeatmapData(username, repoData || []);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load commit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  if (loading) return <Spinner />;
  if (error) return (
    <Card className="text-center py-12 text-danger">
      <p className="font-semibold mb-2">Error loading commit rhythm</p>
      <p className="text-secondary text-sm">{error}</p>
      <button onClick={load} className="mt-4 px-4 py-2 rounded-full bg-accent-primary text-white text-sm hover:bg-accent-hover transition-colors">
        Retry
      </button>
    </Card>
  );
  if (!data) return null;

  const monthLabels = getMonthLabels(data.weeks);
  const maxHourly = Math.max(...data.hourlyPattern.map(h => h.commits), 1);
  const maxWeekly = Math.max(...data.weeklyPattern.map(d => d.commits), 1);

  return (
    <div className="commit-heatmap-container animate-fade-in space-y-8">

      {/* ── Rhythm Highlight Banner ── */}
      <Card className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-accent-primary/10 text-accent-primary shrink-0">
            <Flame size={36} />
          </div>
          <div>
            <h2 className="text-2xl font-bold flex flex-wrap items-center gap-3">
              Coding Rhythm &amp; Activity
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {data.archetype}
              </span>
            </h2>
            <p className="text-sm text-secondary mt-1">
              Real 52-week activity from GitHub Events API
              {data.dataSource && (
                <span className="ml-2 text-xs text-accent-primary/60">· {data.dataSource}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-center flex-wrap">
          <div>
            <p className="text-xs text-secondary uppercase font-semibold">Total Contributions</p>
            <p className="text-2xl font-extrabold text-accent-primary mt-0.5">
              {data.totalContributions.toLocaleString()}
            </p>
          </div>
          <div className="h-8 w-px bg-border hidden md:block" />
          <div>
            <p className="text-xs text-secondary uppercase font-semibold">Active Days</p>
            <p className="text-2xl font-extrabold text-yellow-400 mt-0.5">{data.activeDays}</p>
          </div>
          <div className="h-8 w-px bg-border hidden md:block" />
          <div>
            <p className="text-xs text-secondary uppercase font-semibold">Max Streak</p>
            <p className="text-2xl font-extrabold text-green-400 mt-0.5">{data.maxStreak} Days</p>
          </div>
          <button
            onClick={load}
            className="ml-2 p-2 rounded-full hover:bg-white/5 text-secondary hover:text-primary transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </Card>

      {/* ── 52-Week Grid ── */}
      {!data.hasRealData ? (
        <NoDataBanner username={username} />
      ) : (
        <Card className="space-y-4 overflow-hidden">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Calendar size={20} className="text-accent-primary" /> 52-Week Contribution Grid
            </h3>
            <div className="flex items-center gap-2 text-xs text-secondary">
              <span>Less</span>
              {[0,1,2,3,4].map(l => (
                <HeatmapCell key={l} level={l} date="" count={l} />
              ))}
              <span>More</span>
            </div>
          </div>

          {/* Month labels row */}
          <div className="overflow-x-auto pb-4 pt-1">
            {/* Month label track */}
            <div className="inline-flex flex-col gap-0" style={{ minWidth: `${data.weeks.length * 18}px` }}>
              <div className="flex gap-1.5 mb-1 pl-0">
                {data.weeks.map((_, wIdx) => {
                  const found = monthLabels.find(m => m.idx === wIdx);
                  return (
                    <div key={wIdx} className="w-3 shrink-0 text-[9px] text-secondary">
                      {found ? found.label : ''}
                    </div>
                  );
                })}
              </div>

              {/* Grid */}
              <div className="inline-flex gap-1.5">
                {data.weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1.5">
                    {week.map((day, dIdx) => (
                      <HeatmapCell
                        key={dIdx}
                        level={day.level}
                        date={day.date}
                        count={day.count}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Hourly Distribution */}
        <Card className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock size={20} className="text-purple-400" /> Hourly Peak Productivity
          </h3>
          {data.hourlyPattern.every(h => h.commits === 0) ? (
            <p className="text-secondary text-sm py-8 text-center">No hourly data available (requires public events with timestamps)</p>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourlyPattern}>
                  <XAxis dataKey="hour" tick={{ fill: 'var(--text-secondary,#94a3b8)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-secondary,#94a3b8)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card,#1e293b)', borderColor: 'var(--border,#334155)', borderRadius: '8px', color: '#fff' }}
                    formatter={(v) => [v, 'Commits']}
                  />
                  <Bar dataKey="commits" radius={[4, 4, 0, 0]}>
                    {data.hourlyPattern.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.commits === maxHourly ? '#6366f1' : 'rgba(99,102,241,0.45)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-xs text-secondary text-center">
            Peak hour: <span className="text-accent-primary font-semibold">{data.peakTime}</span> · {data.archetype}
          </p>
        </Card>

        {/* Weekly Day Breakdown */}
        <Card className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Zap size={20} className="text-green-400" /> Weekly Day Frequency
          </h3>
          {data.weeklyPattern.every(d => d.commits === 0) ? (
            <p className="text-secondary text-sm py-8 text-center">No weekly pattern data yet</p>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeklyPattern}>
                  <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary,#94a3b8)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-secondary,#94a3b8)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card,#1e293b)', borderColor: 'var(--border,#334155)', borderRadius: '8px', color: '#fff' }}
                    formatter={(v) => [v, 'Commits']}
                  />
                  <Bar dataKey="commits" radius={[4, 4, 0, 0]}>
                    {data.weeklyPattern.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.commits === maxWeekly ? '#22c55e' : 'rgba(34,197,94,0.45)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-xs text-secondary text-center">
            Busiest day: <span className="text-green-400 font-semibold">
              {data.weeklyPattern.reduce((m, d) => d.commits > m.commits ? d : m, data.weeklyPattern[0]).day}
            </span>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default CommitHeatmapTab;
