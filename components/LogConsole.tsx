import React, { useEffect, useRef } from 'react';
import { ProcessingLog } from '../types';

interface LogConsoleProps {
  logs: ProcessingLog[];
}

const LogConsole: React.FC<LogConsoleProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-brand-dark border border-brand-secondary rounded-sm p-4 h-64 overflow-hidden flex flex-col font-mono text-xs">
      <div className="flex justify-between items-center mb-2 border-b border-brand-secondary pb-2">
        <span className="text-gray-400 uppercase tracking-widest">System Logs</span>
        <span className="text-brand-accent animate-pulse-fast">● LIVE</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {logs.length === 0 && <span className="text-gray-600 italic">System ready. Waiting for input...</span>}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2">
            <span className="text-gray-500">
              [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
            </span>
            <span
              className={`${
                log.type === 'error'
                  ? 'text-red-500'
                  : log.type === 'success'
                  ? 'text-green-400'
                  : log.type === 'action'
                  ? 'text-brand-accent'
                  : 'text-gray-300'
              }`}
            >
              {log.type === 'action' && '> '}
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default LogConsole;
