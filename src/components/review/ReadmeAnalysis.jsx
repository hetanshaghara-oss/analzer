import React from 'react';
import Card from '../ui/Card';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const ReadmeAnalysis = ({ readmeAnalysis }) => {
  const { hasReadme, completeness, sections, missingSections, suggestions } = readmeAnalysis;

  const completenessColor = completeness >= 75 ? 'text-green' : completeness >= 50 ? 'text-yellow' : 'text-red';

  return (
    <Card className="h-full">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="text-2xl">📖</span> README Analysis
      </h3>

      {!hasReadme ? (
        <div className="flex items-center gap-3 p-4 bg-red-op rounded-md">
          <XCircle size={24} className="text-red shrink-0" />
          <div>
            <p className="font-bold text-red">No README Found</p>
            <p className="text-sm text-secondary">A README is critical for any public repository.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6 p-4 bg-secondary rounded-md">
            <span className="font-semibold text-secondary">Completeness Score</span>
            <span className={`text-2xl font-extrabold ${completenessColor}`}>{completeness}%</span>
          </div>

          <div className="grid grid-cols-1 md-grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-green flex items-center gap-2 mb-3">
                <CheckCircle2 size={16} /> Present Sections
              </h4>
              <div className="flex flex-col gap-2">
                {sections.map(s => (
                  <div key={s} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={14} className="text-green shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-red flex items-center gap-2 mb-3">
                <XCircle size={16} /> Missing Sections
              </h4>
              <div className="flex flex-col gap-2">
                {missingSections.length === 0 ? (
                  <p className="text-sm text-green">All key sections present! 🎉</p>
                ) : (
                  missingSections.map(s => (
                    <div key={s} className="flex items-center gap-2 text-sm">
                      <XCircle size={14} className="text-red shrink-0" />
                      <span>{s}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-bold flex items-center gap-2 mb-3 text-yellow">
                <AlertCircle size={16} /> Suggestions
              </h4>
              <div className="flex flex-col gap-2">
                {suggestions.map((s, i) => (
                  <p key={i} className="text-sm text-secondary">• {s}</p>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default ReadmeAnalysis;
