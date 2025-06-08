import React from 'react';
import { AppView } from '../types';
import { ChatBubbleLeftRightIcon, AcademicCapIcon } from './icons/EditorIcons'; // Assuming these exist or similar

interface BottomNavigationBarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

export const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({ currentView, onChangeView }) => {
  const navItems = [
    { view: AppView.CHAT, label: 'AI Chat', icon: ChatBubbleLeftRightIcon },
    { view: AppView.PRACTICE, label: 'Practice', icon: AcademicCapIcon },
  ];

  return (
    <nav className="bg-slate-800/90 backdrop-blur-md shadow-t-lg border-t border-slate-700">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          const IconComponent = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => onChangeView(item.view)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ease-in-out focus:outline-none p-2
                ${isActive ? 'text-sky-400' : 'text-slate-400 hover:text-sky-300'}
              `}
              aria-pressed={isActive}
              aria-label={item.label}
            >
              <IconComponent className={`w-6 h-6 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-sky-400' : 'text-slate-400'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};