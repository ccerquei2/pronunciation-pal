
import React from 'react';
import type { PhonemeAnalysis, PracticePhrase } from '../types';
import { RecordFlow } from './RecordFlow';
import { PronunciationFeedback } from './PronunciationFeedback';
import { LessonDisplay } from './LessonDisplay';
import { AudioPlayer } from './AudioPlayer';
import { AlertTriangleIcon, SparklesIcon } from './icons/EditorIcons'; // Added SparklesIcon

interface MainPanelProps {
  onRecordingComplete: (audioBlob: Blob, transcript: string) => void;
  analysis: PhonemeAnalysis | null;
  isLoadingAnalysis: boolean;
  personalizedLesson: PracticePhrase[] | null;
  userTranscript: string;
  error: string | null;
  playAiFeedbackAudio: (text: string) => void;
  isAiSpeaking: boolean;
  currentRecording: Blob | null;
  onGenerateLesson: () => void; // Added
  isLoadingLesson: boolean; // Added
}

export const MainPanel: React.FC<MainPanelProps> = ({
  onRecordingComplete,
  analysis,
  isLoadingAnalysis,
  personalizedLesson,
  userTranscript,
  error,
  playAiFeedbackAudio,
  isAiSpeaking,
  currentRecording,
  onGenerateLesson, // Added
  isLoadingLesson, // Added
}) => {
  return (
    <main className="flex-1 p-6 md:p-10 bg-gradient-to-br from-slate-900 to-slate-800 space-y-8 overflow-y-auto h-screen">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-sky-400">Pronunciation Pal</h1>
          <p className="text-slate-300 mt-2 text-lg">Your Personal AI Pronunciation Coach</p>
        </header>

        <RecordFlow onRecordingComplete={onRecordingComplete} disabled={isLoadingAnalysis || isAiSpeaking}/>

        <div className="mt-6">
          <button
            onClick={onGenerateLesson}
            disabled={isLoadingLesson || isLoadingAnalysis || isAiSpeaking}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {isLoadingLesson ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Lesson...
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5 mr-2" />
                New Personalized Lesson
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-6 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg relative flex items-start" role="alert">
            <AlertTriangleIcon className="h-5 w-5 text-red-300 mr-3 mt-1 flex-shrink-0" />
            <div>
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline ml-1">{error}</span>
            </div>
          </div>
        )}

        {isLoadingAnalysis && (
          <div className="mt-8 text-center py-10">
            <div className="animate-pulse flex flex-col items-center">
              <svg className="w-16 h-16 text-sky-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <p className="text-xl font-semibold text-slate-300">Analyzing your pronunciation...</p>
              <p className="text-slate-400">This might take a moment.</p>
            </div>
          </div>
        )}

        {analysis && (
          <div className="mt-8 space-y-6">
            <PronunciationFeedback
              analysis={analysis}
              userTranscript={userTranscript}
              onPlayAiFeedback={() => analysis.overallFeedback && playAiFeedbackAudio(analysis.overallFeedback)}
              isAiSpeaking={isAiSpeaking}
            />
            {currentRecording && (
              <div className="bg-slate-700 p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-sky-400 mb-2">Your Recording:</h3>
                <AudioPlayer audioBlob={currentRecording} />
              </div>
            )}
          </div>
        )}

        {personalizedLesson && (
          <div className="mt-8">
            <LessonDisplay
              phrases={personalizedLesson}
              onPlayPhrase={(phrase) => playAiFeedbackAudio(phrase)}
              isAiSpeaking={isAiSpeaking}
            />
          </div>
        )}
         {!analysis && !isLoadingAnalysis && !personalizedLesson && (
          <div className="mt-12 text-center text-slate-400">
            <p className="text-lg">Click the microphone to start your practice session!</p>
            <p className="mt-2">Or, generate a new personalized lesson to begin.</p>
          </div>
        )}
      </div>
    </main>
  );
};
