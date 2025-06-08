import React from 'react';

interface GrammarScoreIndicatorProps {
  score: number | null;
  compact?: boolean;
  bubble?: boolean; // For even more compact display in chat bubbles
}

export const GrammarScoreIndicator: React.FC<GrammarScoreIndicatorProps> = ({ score, compact = false, bubble = false }) => {
  if (score === null) return null;

  const getScoreColor = () => {
    if (score >= 75) return 'bg-teal-500 text-teal-50';
    if (score >= 50) return 'bg-amber-500 text-amber-50';
    return 'bg-rose-500 text-rose-50';
  };
  
  const getScoreRingColor = () => {
    if (score >= 75) return 'ring-teal-400';
    if (score >= 50) return 'ring-amber-400';
    return 'ring-rose-400';
  }

  if (bubble) {
     return (
      <div className={`px-1.5 py-0.5 rounded-md text-[0.6rem] font-semibold ${getScoreColor()}`}>
        Grammar: {score}%
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScoreColor()}`}>
        Grammar: {score}%
      </div>
    );
  }

  return (
    <div className={`relative p-3 rounded-lg shadow-lg ${getScoreColor()} border-2 ${getScoreRingColor().replace('ring-','border-')}`}>
        <div className="flex flex-col items-center justify-center">
            <span className="text-xs uppercase font-semibold tracking-wider opacity-80">Grammar Score</span>
            <span className="text-3xl font-bold mt-1">{score}%</span>
        </div>
    </div>
  );
};