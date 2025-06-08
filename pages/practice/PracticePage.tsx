import React, { useState } from 'react';
import type { PhonemeAnalysis, PracticePhrase, DailyChallenge, UserProfile } from '../../types';
import { RecordFlow } from '../../components/RecordFlow';
import { PronunciationFeedback } from '../../components/PronunciationFeedback';
import { LessonDisplay } from '../../components/LessonDisplay';
import { AudioPlayer } from '../../components/AudioPlayer';
import { AlertTriangleIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon, ChartBarIcon, StarIcon as ChallengeStarIcon, XCircleIcon } from '../../components/icons/EditorIcons';
import { PhonemeProgressChart } from '../../components/PhonemeProgressChart';
import { DailyChallengeCard } from '../../components/DailyChallengeCard';
import { APP_NAME } from '../../constants';


interface PracticePageProps {
  userProfile: UserProfile;
  dailyChallenge: DailyChallenge | null;
  onRecordingComplete: (audioBlob: Blob, transcript: string) => void;
  analysis: PhonemeAnalysis | null;
  isLoadingAnalysis: boolean;
  personalizedLesson: PracticePhrase[] | null;
  userTranscript: string;
  error: string | null;
  playAiFeedbackAudio: (text: string, onEndCallback?: () => void) => void;
  isAiSpeaking: boolean;
  currentRecording: Blob | null;
  onGenerateLesson: () => void;
  isLoadingLesson: boolean;
  setError: (message: string | null) => void;
}

const CollapsibleSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; initiallyOpen?: boolean }> = ({ title, icon: Icon, children, initiallyOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  return (
    <div className="bg-slate-700/50 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left text-slate-200 hover:bg-slate-700/80 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          <Icon className="w-5 h-5 mr-2 text-sky-400" />
          <span className="font-medium">{title}</span>
        </div>
        {isOpen ? <ChevronUpIcon className="w-5 h-5 text-slate-400" /> : <ChevronDownIcon className="w-5 h-5 text-slate-400" />}
      </button>
      {isOpen && (
        <div className="p-3 border-t border-slate-600">
          {children}
        </div>
      )}
    </div>
  );
};


export const PracticePage: React.FC<PracticePageProps> = ({
  userProfile,
  dailyChallenge,
  onRecordingComplete,
  analysis,
  isLoadingAnalysis,
  personalizedLesson,
  userTranscript,
  error,
  playAiFeedbackAudio,
  isAiSpeaking,
  currentRecording,
  onGenerateLesson,
  isLoadingLesson,
  setError,
}) => {
  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto h-full">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-sky-400">{APP_NAME} - Practice Mode</h1>
        <p className="text-slate-300 mt-1 text-md">Hone your English pronunciation skills.</p>
      </header>

      <RecordFlow onRecordingComplete={onRecordingComplete} disabled={isLoadingAnalysis || isAiSpeaking || isLoadingLesson}/>

      <div className="mt-4">
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
        <div className="mt-4 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg relative flex items-start" role="alert">
          <AlertTriangleIcon className="h-5 w-5 text-red-300 mr-3 mt-1 flex-shrink-0" />
          <div>
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-1">{error}</span>
          </div>
           <button onClick={() => setError(null)} className="absolute top-2 right-2 text-red-300 hover:text-red-100">
             <XCircleIcon className="w-5 h-5" />
           </button>
        </div>
      )}

      {isLoadingAnalysis && (
        <div className="mt-6 text-center py-8">
          <div className="animate-pulse flex flex-col items-center">
            <svg className="w-12 h-12 text-sky-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <p className="text-lg font-semibold text-slate-300">Analyzing your pronunciation...</p>
            <p className="text-slate-400 text-sm">This might take a moment.</p>
          </div>
        </div>
      )}

      {analysis && (
        <div className="mt-6 space-y-4">
          <PronunciationFeedback
            analysis={analysis}
            userTranscript={userTranscript}
            onPlayAiFeedback={() => analysis.overallFeedback && playAiFeedbackAudio(analysis.overallFeedback)}
            isAiSpeaking={isAiSpeaking}
          />
          {currentRecording && (
            <div className="bg-slate-700/80 p-3 rounded-lg shadow">
              <h3 className="text-md font-medium text-sky-400 mb-1.5">Your Recording:</h3>
              <AudioPlayer audioBlob={currentRecording} />
            </div>
          )}
        </div>
      )}

      {personalizedLesson && (
        <div className="mt-6">
          <LessonDisplay
            phrases={personalizedLesson}
            onPlayPhrase={(phrase) => playAiFeedbackAudio(phrase)}
            isAiSpeaking={isAiSpeaking}
          />
        </div>
      )}

      {!analysis && !isLoadingAnalysis && !personalizedLesson && !error && (
        <div className="mt-8 text-center text-slate-400">
          <p className="text-md">Click the microphone to start your practice session!</p>
          <p className="mt-1 text-sm">Or, generate a new personalized lesson to begin.</p>
        </div>
      )}

      <div className="space-y-4 mt-6 pb-4">
        <CollapsibleSection title="Phoneme Progress" icon={ChartBarIcon}>
          {userProfile.phonemeProgress.length > 0 ? (
            <PhonemeProgressChart data={userProfile.phonemeProgress} />
          ) : (
            <p className="text-slate-400 text-sm">Practice to see your progress here!</p>
          )}
        </CollapsibleSection>

        {dailyChallenge && (
          <CollapsibleSection title="Daily Challenge" icon={ChallengeStarIcon}>
            <DailyChallengeCard challenge={dailyChallenge} />
          </CollapsibleSection>
        )}
      </div>
       <div className="text-center text-xs text-slate-500 py-4 border-t border-slate-700">
          <p>Audio features rely on OpenAI APIs. Ensure <code>OPENAI_API_KEY</code> is configured.</p>
       </div>
    </div>
  );
};
