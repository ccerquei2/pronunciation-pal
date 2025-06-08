
import React from 'react';
import type { DailyChallenge } from '../types';
import { StarIcon } from './icons/EditorIcons';

interface DailyChallengeCardProps {
  challenge: DailyChallenge;
}

export const DailyChallengeCard: React.FC<DailyChallengeCardProps> = ({ challenge }) => {
  return (
    <div className="bg-gradient-to-r from-sky-700 to-cyan-600 p-5 rounded-lg shadow-lg text-white">
      <div className="flex items-center mb-2">
        <StarIcon className="w-6 h-6 text-yellow-300 mr-2" />
        <h3 className="text-xl font-semibold">{challenge.title}</h3>
      </div>
      <p className="text-sm text-sky-100 mb-3">{challenge.description}</p>
      <div className="bg-black/20 p-3 rounded">
        <p className="text-sm text-sky-100">Try saying:</p>
        <p className="font-medium text-lg text-yellow-300">"{challenge.phraseToPractice}"</p>
      </div>
    </div>
  );
};
