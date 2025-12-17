import React from 'react';
import { PipelineStage } from '../types';

interface PipelineVisualizerProps {
  currentStage: PipelineStage;
}

const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ currentStage }) => {
  const stages = [
    { id: PipelineStage.SCANNING, label: 'SCAN', icon: '📡' },
    { id: PipelineStage.RANKING, label: 'RANK', icon: '📊' },
    { id: PipelineStage.VERIFYING, label: 'VERIFY', icon: '🛡️' },
    { id: PipelineStage.GENERATING_ART, label: 'ART', icon: '🎨' },
    { id: PipelineStage.PUBLISHING, label: 'PUBLISH', icon: '🚀' },
  ];

  const getStatusColor = (stageId: PipelineStage) => {
    if (currentStage === PipelineStage.IDLE) return 'text-gray-700 border-gray-800 bg-transparent';
    
    const currentIndex = stages.findIndex(s => s.id === currentStage);
    const stageIndex = stages.findIndex(s => s.id === stageId);

    if (stageIndex === currentIndex) return 'text-black bg-brand-accent border-brand-accent animate-pulse';
    if (stageIndex < currentIndex) return 'text-brand-accent border-brand-accent bg-transparent';
    return 'text-gray-700 border-gray-800 bg-transparent';
  };

  return (
    <div className="bg-brand-dark border border-brand-secondary p-4 rounded-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Autonomous Pipeline</h3>
        <span className="text-[10px] font-mono text-gray-600">v2.1.0</span>
      </div>
      <div className="flex justify-between gap-1">
        {stages.map((stage, idx) => (
          <div key={stage.id} className="flex flex-col items-center gap-2 flex-1">
            <div 
              className={`w-full aspect-square flex items-center justify-center rounded-sm border-2 transition-all duration-300 ${getStatusColor(stage.id)}`}
            >
              <span className="text-xl md:text-2xl filter drop-shadow-md">{stage.icon}</span>
            </div>
            <span className={`text-[9px] md:text-[10px] font-mono font-bold tracking-wider ${stage.id === currentStage ? 'text-brand-accent' : 'text-gray-600'}`}>
              {stage.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PipelineVisualizer;
