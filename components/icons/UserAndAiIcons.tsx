import React from 'react';

// Re-using SparklesIcon as AI icon for now, can be replaced with a more specific AI/bot icon
export { SparklesIcon } from './EditorIcons'; 

export const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

// Example of a more dedicated AI icon if Sparkles is not desired long-term
export const AiBotIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM12.75 12.75a.75.75 0 00-1.5 0v2.25a.75.75 0 001.5 0v-2.25zM12 17.25a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H12a.75.75 0 01-.75-.75v-.008z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 12a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM14.25 12a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM6.75 14.25S8.25 12 12 12s5.25 2.25 5.25 2.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.022 17.022a10.456 10.456 0 0113.956 0" />
  </svg>
);
