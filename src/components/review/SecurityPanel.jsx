import React from 'react';
import Card from '../ui/Card';
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

const SecurityPanel = ({ securityFlags }) => {
  const passCount = securityFlags.filter(f => f.safe).length;
  const allSafe = passCount === securityFlags.length;

  return (
    <Card className="h-full">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="text-2xl">🔒</span> Security Review
      </h3>

      <div className={`flex items-center gap-4 p-4 rounded-md mb-6 ${allSafe ? 'bg-green-op' : 'bg-red-op'}`}>
        {allSafe ? (
          <ShieldCheck size={32} className="text-green shrink-0" />
        ) : (
          <ShieldAlert size={32} className="text-red shrink-0" />
        )}
        <div>
          <p className={`font-bold text-lg ${allSafe ? 'text-green' : 'text-red'}`}>
            {allSafe ? 'All Security Checks Passed' : `${passCount}/${securityFlags.length} Checks Passed`}
          </p>
          <p className="text-sm text-secondary">
            {allSafe ? 'No obvious security issues detected.' : 'Some security concerns were identified.'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {securityFlags.map((flag, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 rounded-md bg-secondary">
            {flag.safe ? (
              <Shield size={16} className="text-green shrink-0" />
            ) : (
              <ShieldAlert size={16} className="text-red shrink-0" />
            )}
            <span className={`text-sm font-medium ${flag.safe ? '' : 'text-red'}`}>{flag.label}</span>
            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${flag.safe ? 'text-green bg-green-op' : 'text-red bg-red-op'}`}>
              {flag.safe ? 'PASS' : 'FAIL'}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default SecurityPanel;
