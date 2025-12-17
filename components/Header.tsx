import React from 'react';

interface HeaderProps {
  isConnected: boolean;
  onConnect: () => void;
}

const Header: React.FC<HeaderProps> = ({ isConnected, onConnect }) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-brand-secondary bg-brand-black sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-accent rounded-sm flex items-center justify-center">
          <span className="text-black font-bold text-xl">B</span>
        </div>
        <h1 className="text-xl font-display font-bold tracking-tight text-white">
          BOLD <span className="text-brand-accent">BRIEFING</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          SYSTEM ONLINE
        </div>
        <button
          onClick={onConnect}
          className={`px-4 py-2 text-sm font-bold rounded-sm transition-colors border ${
            isConnected
              ? 'bg-transparent text-brand-accent border-brand-accent'
              : 'bg-white text-black border-white hover:bg-gray-200'
          }`}
        >
          {isConnected ? '@BoldBriefing Connected' : 'Connect X Account'}
        </button>
      </div>
    </header>
  );
};

export default Header;
