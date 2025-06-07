
import React from 'react';
import type { PracticePhrase } from '../types';
import { SpeakerWaveIcon, LightBulbIcon } from './icons/FeedbackIcons';

interface LessonDisplayProps {
  phrases: PracticePhrase[];
  onPlayPhrase: (phrase: string) => void;
  isAiSpeaking: boolean;
}

export const LessonDisplay: React.FC<LessonDisplayProps> = ({ phrases, onPlayPhrase, isAiSpeaking }) => {
  if (!phrases || phrases.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-700/80 p-6 rounded-xl shadow-lg space-y-6 backdrop-blur-sm">
      <h2 className="text-2xl font-semibold text-sky-400">Your Personalized Lesson</h2>
      <div className="space-y-4">
        {phrases.map((item, index) => (
          <div key={index} className="bg-slate-600/70 p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <p className="text-lg text-slate-100 mb-1 flex-grow">"{item.phrase}"</p>
              <button
                onClick={() => onPlayPhrase(item.phrase)}
                disabled={isAiSpeaking}
                className="p-2 rounded-full text-sky-400 hover:bg-sky-600 disabled:opacity-50 transition-colors flex-shrink-0 ml-2"
                title="Hear phrase"
              >
                <SpeakerWaveIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-start text-sm text-sky-300 mt-2">
              <LightBulbIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span><span className="font-semibold">Tip:</span> {item.tip}</span>
            </div>
            {item.targetPhonemes && item.targetPhonemes.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                Focus on: {item.targetPhonemes.join(', ')}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
