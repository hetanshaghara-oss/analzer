import React from 'react';
import Card from '../ui/Card';
import { Lightbulb, CheckCircle2, XCircle } from 'lucide-react';

const StrengthWeaknessItem = ({ text, type }) => (
  <div className={`flex items-start gap-3 p-3 rounded-md ${type === 'strength' ? 'bg-green-op' : 'bg-red-op'}`}>
    {type === 'strength'
      ? <CheckCircle2 size={16} className="text-green shrink-0 mt-0.5" />
      : <XCircle size={16} className="text-red shrink-0 mt-0.5" />
    }
    <p className="text-sm font-medium">{text}</p>
  </div>
);

const RecommendationsList = ({ strengths, weaknesses, recommendations }) => {
  return (
    <Card className="h-full">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="text-2xl">💡</span> Strengths, Weaknesses & Recommendations
      </h3>

      <div className="grid grid-cols-1 md-grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="text-green font-bold mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} /> Strengths
          </h4>
          <div className="flex flex-col gap-2">
            {strengths.map((s, i) => <StrengthWeaknessItem key={i} text={s} type="strength" />)}
          </div>
        </div>
        <div>
          <h4 className="text-red font-bold mb-3 flex items-center gap-2">
            <XCircle size={16} /> Weaknesses
          </h4>
          <div className="flex flex-col gap-2">
            {weaknesses.map((w, i) => <StrengthWeaknessItem key={i} text={w} type="weakness" />)}
          </div>
        </div>
      </div>

      <div className="pt-6 border-t">
        <h4 className="text-yellow font-bold mb-4 flex items-center gap-2">
          <Lightbulb size={16} /> AI Recommendations
        </h4>
        <div className="flex flex-col gap-3">
          {recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-yellow-op">
              <span className="text-yellow font-bold text-sm shrink-0">{i + 1}.</span>
              <p className="text-sm font-medium">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default RecommendationsList;
