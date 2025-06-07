import React from 'react';
import type { Phoneme, DailyChallenge, AppView } from '../types';
import { PhonemeProgressChart } from './PhonemeProgressChart';
import { DailyChallengeCard } from './DailyChallengeCard';
import { AppView as AppViewEnum } from '../types'; // Import enum for comparison
import { ChatBubbleLeftRightIcon, AcademicCapIcon } from './icons/EditorIcons'; // Assuming these exist or similar

interface SidebarProps {
  phonemeProgress: Phoneme[];
  dailyChallenge: DailyChallenge | null;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ phonemeProgress, dailyChallenge, currentView, onChangeView }) => {
  const navButtonBaseStyle = "w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800";
  const activeButtonStyle = "bg-sky-600 text-white hover:bg-sky-500 focus:ring-sky-500";
  const inactiveButtonStyle = "bg-slate-700 text-sky-300 hover:bg-slate-600 focus:ring-sky-400";

  return (
    <aside className="w-full md:w-1/3 lg:w-1/4 bg-slate-800 p-6 space-y-8 shadow-lg md:h-screen md:overflow-y-auto">
      <div className="space-y-4">
        <button
          onClick={() => onChangeView(AppViewEnum.PRACTICE)}
          className={`${navButtonBaseStyle} ${currentView === AppViewEnum.PRACTICE ? activeButtonStyle : inactiveButtonStyle}`}
          aria-pressed={currentView === AppViewEnum.PRACTICE}
        >
          <AcademicCapIcon className="w-5 h-5" />
          <span>Practice Mode</span>
        </button>
        <button
          onClick={() => onChangeView(AppViewEnum.CHAT)}
          className={`${navButtonBaseStyle} ${currentView === AppViewEnum.CHAT ? activeButtonStyle : inactiveButtonStyle}`}
          aria-pressed={currentView === AppViewEnum.CHAT}
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          <span>AI Chat Coach</span>
        </button>
      </div>
      
      {currentView === AppViewEnum.PRACTICE && (
        <>
          <div>
            <h2 className="text-2xl font-semibold text-sky-400 mb-4 mt-6">Your Phoneme Progress</h2>
            {phonemeProgress.length > 0 ? (
              <PhonemeProgressChart data={phonemeProgress} />
            ) : (
              <p className="text-slate-400">Practice to see your progress here!</p>
            )}
          </div>

          {dailyChallenge && (
            <DailyChallengeCard challenge={dailyChallenge} />
          )}
        </>
      )}

       <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-700 mt-auto"> {/* Changed mt-6 to mt-auto for footer */}
          <p>Remember, your API key for AI services should be securely managed on a backend server, not in the frontend code.</p>
          <p className="mt-1">This app uses browser capabilities for STT/TTS for demo purposes.</p>
       </div>
    </aside>
  );
};