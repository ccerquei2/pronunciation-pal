import React from 'react';

interface PronunciationScoreIndicatorProps {
  score: number | null;
  compact?: boolean;
  bubble?: boolean; // For even more compact display in chat bubbles
}

export const PronunciationScoreIndicator: React.FC<PronunciationScoreIndicatorProps> = ({ score, compact = false, bubble = false }) => {
  if (score === null) return null;

  const getScoreColor = () => {
    if (score >= 75) return 'bg-green-500 text-green-50';
    if (score >= 50) return 'bg-yellow-500 text-yellow-50';
    return 'bg-red-500 text-red-50';
  };
  
  const getScoreRingColor = (): string => {
    if (score >= 75) return 'ring-green-400';
    if (score >= 50) return 'ring-yellow-400';
    return 'ring-red-400';
  }

  if (bubble) {
     return (
      <div className={`px-1.5 py-0.5 rounded-md text-[0.6rem] font-semibold ${getScoreColor()}`}>
        Pron: {score}%
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScoreColor()}`}>
        Pronunciation: {score}%
      </div>
    );
  }

  return (
    <div className={`relative p-3 rounded-lg shadow-lg ${getScoreColor()} border-2 ${getScoreRingColor().replace('ring-','border-')}`}>
        <div className="flex flex-col items-center justify-center">
            <span className="text-xs uppercase font-semibold tracking-wider opacity-80">Pronunciation Score</span>
            <span className="text-3xl font-bold mt-1">{score}%</span>
        </div>
        <div 
            className={`absolute inset-0 rounded-lg ring-4 ring-opacity-30 animate-pulse opacity-50 ${getScoreRingColor()}`}
            style={{ animationDuration: '3s' }}>
        </div>
    </div>
  );
};