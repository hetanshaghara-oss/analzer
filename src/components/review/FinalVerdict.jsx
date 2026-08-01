import React from 'react';
import Card from '../ui/Card';
import { Printer } from 'lucide-react';

const gradeColors = {
  A: 'text-green',
  B: 'text-blue',
  C: 'text-yellow',
  D: 'text-red',
};

const gradeBg = {
  A: 'bg-green-op',
  B: 'bg-blue-op',
  C: 'bg-yellow-op',
  D: 'bg-red-op',
};

const FinalVerdict = ({ verdict, repoData, username }) => {
  const handleExport = () => {
    window.print();
  };

  return (
    <Card className={`final-verdict-card ${gradeBg[verdict.grade]}`}>
      <div className="flex flex-col md-flex-row items-start md-flex-row-items-center gap-6 justify-between">
        <div className="flex items-center gap-6">
          <div className={`text-7xl font-extrabold ${gradeColors[verdict.grade]}`}>
            {verdict.grade}
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-1">Final Verdict: {verdict.label}</h3>
            <p className="text-secondary max-w-xl leading-relaxed">{verdict.description}</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="btn-primary flex items-center gap-2 shrink-0 print-hide"
        >
          <Printer size={16} />
          Export Report
        </button>
      </div>
    </Card>
  );
};

export default FinalVerdict;
