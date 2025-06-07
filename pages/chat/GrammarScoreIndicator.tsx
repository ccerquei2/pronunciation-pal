
import React from 'react';

interface GrammarScoreIndicatorProps {
  score: number | null;
  compact?: boolean;
}

export const GrammarScoreIndicator: React.FC<GrammarScoreIndicatorProps> = ({ score, compact = false }) => {
  if (score === null) return null;

  const getScoreColor = () => {
    if (score >= 75) return 'bg-teal-500 text-teal-50'; // Different color scheme for grammar
    if (score >= 50) return 'bg-amber-500 text-amber-50';
    return 'bg-rose-500 text-rose-50'; // Using rose for red
  };
  
  const getScoreRingColor = () => {
    if (score >= 75) return 'ring-teal-400';
    if (score >= 50) return 'ring-amber-400';
    return 'ring-rose-400';
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
        {/* Optional pulse animation, can be too much with multiple scores
        <div className="absolute -top-2 -left-2 w-full h-full rounded-lg ring-4 ring-opacity-30 animate-pulse opacity-50"
             style={{ animationDuration: '3.5s', borderColor: getScoreRingColor().replace('ring-','border-') }}></div>
        */}
    </div>
  );
};
