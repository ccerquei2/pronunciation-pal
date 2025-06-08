
import React from 'react';
import type { PhonemeAnalysis } from '../types';
import { CheckCircleIcon, XCircleIcon, SpeakerWaveIcon } from './icons/FeedbackIcons';

interface PronunciationFeedbackProps {
  analysis: PhonemeAnalysis;
  userTranscript: string;
  onPlayAiFeedback: () => void;
  isAiSpeaking: boolean;
}

export const PronunciationFeedback: React.FC<PronunciationFeedbackProps> = ({ analysis, userTranscript, onPlayAiFeedback, isAiSpeaking }) => {
  return (
    <div className="bg-slate-700/80 p-6 rounded-xl shadow-lg space-y-6 backdrop-blur-sm">
      <h2 className="text-2xl font-semibold text-sky-400">Feedback on Your Pronunciation</h2>
      
      <div>
        <h3 className="text-lg font-medium text-slate-200 mb-1">You said:</h3>
        <p className="italic text-slate-300 bg-slate-600 p-3 rounded-md">"{userTranscript || 'No transcript available.'}"</p>
      </div>

      {analysis.correctedTranscript && (
        <div>
          <h3 className="text-lg font-medium text-slate-200 mb-1">AI thinks you meant:</h3>
          <p className="italic text-green-300 bg-slate-600 p-3 rounded-md">"{analysis.correctedTranscript}"</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-slate-200">AI Coach's Overall Feedback:</h3>
            <button
                onClick={onPlayAiFeedback}
                disabled={isAiSpeaking || !analysis.overallFeedback}
                className="p-2 rounded-full text-sky-400 hover:bg-sky-700 disabled:opacity-50 transition-colors"
                title="Play AI feedback"
            >
                <SpeakerWaveIcon className="w-6 h-6" />
            </button>
        </div>
        <p className="text-slate-300 bg-slate-600 p-3 rounded-md">{analysis.overallFeedback}</p>
      </div>

      {analysis.analyzedPhonemes && analysis.analyzedPhonemes.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-slate-200 mb-3 pt-3 border-t border-slate-600">Phoneme Breakdown:</h3>
          <div className="space-y-4">
            {analysis.analyzedPhonemes.map((item, index) => (
              <div key={index} className={`p-4 rounded-lg shadow-md border-l-4 ${item.isCorrect ? 'bg-green-800/30 border-green-500' : 'bg-red-800/30 border-red-500'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-2xl font-mono ${item.isCorrect ? 'text-green-400' : 'text-red-400'}`}>{item.ipa}</span>
                  {item.isCorrect ? (
                    <CheckCircleIcon className="w-7 h-7 text-green-400" />
                  ) : (
                    <XCircleIcon className="w-7 h-7 text-red-400" />
                  )}
                </div>
                <p className="text-sm text-slate-300">
                  <span className="font-semibold">Phoneme:</span> {item.phoneme}
                </p>
                {!item.isCorrect && (
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold">You said:</span> <span className="font-mono text-orange-400">{item.userAttemptDisplay}</span> (sounds like)
                  </p>
                )}
                <p className="text-sm text-slate-300">
                  <span className="font-semibold">Correct sound:</span> <span className="font-mono text-green-400">{item.correctDisplay}</span>
                </p>
                <p className="mt-2 text-slate-300 text-sm bg-slate-600/50 p-2 rounded">{item.feedback}</p>
                {item.articulatoryExplanation && (
                   <details className="mt-2 text-sm">
                        <summary className="text-sky-400 cursor-pointer hover:text-sky-300">How to make this sound?</summary>
                        <p className="text-slate-400 mt-1 pl-2 border-l-2 border-sky-500">{item.articulatoryExplanation}</p>
                   </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
