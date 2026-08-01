import React from 'react';
import Card from '../ui/Card';
import { Zap, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const iconMap = {
  good: <CheckCircle2 size={18} className="text-green shrink-0" />,
  warning: <AlertTriangle size={18} className="text-yellow shrink-0" />,
  info: <Info size={18} className="text-blue shrink-0" />,
};

const bgMap = {
  good: 'bg-green-op',
  warning: 'bg-yellow-op',
  info: 'bg-blue-op',
};

const PerformancePanel = ({ performanceInsights }) => {
  return (
    <Card className="h-full">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="text-2xl">⚡</span> Performance Review
      </h3>
      <div className="flex flex-col gap-3">
        {performanceInsights.map((insight, idx) => (
          <div key={idx} className={`flex items-start gap-3 p-4 rounded-md ${bgMap[insight.type]}`}>
            {iconMap[insight.type]}
            <p className="text-sm font-medium leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PerformancePanel;
