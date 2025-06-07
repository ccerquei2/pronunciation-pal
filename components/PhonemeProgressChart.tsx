
import React from 'react';
import type { Phoneme } from '../types';

interface PhonemeProgressChartProps {
  data: Phoneme[];
}

export const PhonemeProgressChart: React.FC<PhonemeProgressChartProps> = ({ data }) => {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No progress data yet. Start practicing!</p>;
  }

  const sortedData = [...data].sort((a, b) => a.score - b.score); // Show lowest scores first or sort alphabetically

  return (
    <div className="space-y-3">
      {sortedData.map((phoneme) => (
        <div key={phoneme.ipa} className="text-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-200 font-medium">
              {phoneme.phoneme} <span className="text-slate-400 font-mono">({phoneme.ipa})</span>
            </span>
            <span className={`font-semibold ${phoneme.score >= 70 ? 'text-green-400' : phoneme.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              {phoneme.score}%
            </span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ease-out ${phoneme.score >= 70 ? 'bg-green-500' : phoneme.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${phoneme.score}%` }}
            ></div>
          </div>
           <p className="text-xs text-slate-500 mt-0.5">Attempts: {phoneme.attempts}, Correct: {phoneme.correctAttempts}</p>
        </div>
      ))}
    </div>
  );
};
