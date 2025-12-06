import React, { ReactNode } from 'react';
import { AppMode } from '../types';

interface LayoutProps {
  children: ReactNode;
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentMode, onModeChange }) => {
  return (
    <div className="flex flex-col h-screen supports-[height:100dvh]:h-[100dvh] w-full max-w-md mx-auto md:max-w-4xl bg-hybrid-black border-x border-gray-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-hybrid-dark border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-hybrid-accent flex items-center justify-center text-hybrid-black font-bold text-xl">
            <i className="fa-solid fa-bolt"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">HybridOne</h1>
            <p className="text-xs text-hybrid-accent tracking-widest uppercase">Elite AI Coach</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative w-full">
        {children}
      </main>

      {/* Navigation Tabs */}
      <nav className="flex bg-hybrid-dark border-t border-gray-800 shrink-0 pb-safe">
        <button
          onClick={() => onModeChange(AppMode.CHAT)}
          className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-colors active:bg-gray-800 ${
            currentMode === AppMode.CHAT
              ? 'text-hybrid-accent border-t-2 border-hybrid-accent'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <i className="fa-regular fa-comments text-lg"></i>
          <span className="text-xs font-medium uppercase">Coach Chat</span>
        </button>
        <button
          onClick={() => onModeChange(AppMode.PLANNER)}
          className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-colors active:bg-gray-800 ${
            currentMode === AppMode.PLANNER
              ? 'text-hybrid-accent border-t-2 border-hybrid-accent'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <i className="fa-solid fa-dumbbell text-lg"></i>
          <span className="text-xs font-medium uppercase">Program Builder</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;