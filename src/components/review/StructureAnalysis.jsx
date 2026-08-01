import React from 'react';
import Card from '../ui/Card';
import { FolderOpen, File, CheckCircle2, XCircle } from 'lucide-react';

const StructureAnalysis = ({ structureAnalysis }) => {
  const { folders, goodPatterns, missingPatterns, organizationScore } = structureAnalysis;
  const scoreColor = organizationScore >= 70 ? 'text-green' : organizationScore >= 50 ? 'text-yellow' : 'text-red';

  return (
    <Card className="h-full">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="text-2xl">📁</span> Project Structure
      </h3>

      <div className="flex items-center justify-between mb-6 p-4 bg-secondary rounded-md">
        <span className="font-semibold text-secondary">Organization Score</span>
        <span className={`text-2xl font-extrabold ${scoreColor}`}>{organizationScore}%</span>
      </div>

      {folders.length > 0 && (
        <div className="mb-6">
          <h4 className="font-bold text-secondary text-sm uppercase tracking-wider mb-3">Root Directories</h4>
          <div className="flex flex-wrap gap-2">
            {folders.slice(0, 12).map(folder => (
              <span key={folder} className="flex items-center gap-1 text-xs px-2 py-1 bg-secondary rounded-md font-medium">
                <FolderOpen size={12} className="text-yellow" />
                {folder}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md-grid-cols-2 gap-6">
        <div>
          <h4 className="font-bold text-green flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} /> Good Patterns
          </h4>
          <div className="flex flex-col gap-2">
            {goodPatterns.map(p => (
              <div key={p.key} className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={14} className="text-green shrink-0" />
                <span>{p.key}</span>
              </div>
            ))}
            {goodPatterns.length === 0 && <p className="text-sm text-muted">No positive patterns detected.</p>}
          </div>
        </div>
        <div>
          <h4 className="font-bold text-red flex items-center gap-2 mb-3">
            <XCircle size={16} /> Missing Elements
          </h4>
          <div className="flex flex-col gap-2">
            {missingPatterns.map(p => (
              <div key={p.key} className="flex items-center gap-2 text-sm">
                <XCircle size={14} className="text-red shrink-0" />
                <span>{p.key}</span>
              </div>
            ))}
            {missingPatterns.length === 0 && <p className="text-sm text-green">All recommended elements present! 🎉</p>}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StructureAnalysis;
