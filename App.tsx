import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import LogConsole from './components/LogConsole';
import ArticleCard from './components/ArticleCard';
import PipelineVisualizer from './components/PipelineVisualizer';
import { Category, Region, NewsArticle, ProcessingLog, PipelineStage } from './types';
import { fetchTrendingTopic, draftBriefing, generateBriefImage } from './services/geminiService';

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(() => {
    return localStorage.getItem('bold_briefing_connected') === 'true';
  });
  
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>(PipelineStage.IDLE);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([Region.KENYA, Region.EAST_AFRICA]);
  
  const autoPilotRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = (message: string, type: ProcessingLog['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: crypto.randomUUID(),
      message,
      timestamp: Date.now(),
      type
    }]);
  };

  const handleConnect = () => {
    const confirm = window.confirm("Connect to X Account: @BoldBriefing?");
    if (confirm) {
      setTimeout(() => {
        setIsConnected(true);
        localStorage.setItem('bold_briefing_connected', 'true');
        addLog("Secure connection established with X API Gateway.", "success");
      }, 800);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    localStorage.removeItem('bold_briefing_connected');
    addLog("X Account disconnected.", "info");
  };

  const runAgentCycle = useCallback(async () => {
    if (!process.env.API_KEY) {
        addLog("CRITICAL: API Key missing. Aborting cycle.", "error");
        setIsAutoPilot(false);
        setPipelineStage(PipelineStage.IDLE);
        return;
    }

    try {
      // 1. SELECT TARGET
      const categories = Object.values(Category);
      let targetRegion: Region;
      if (selectedRegions.includes(Region.KENYA) && Math.random() > 0.4) {
        targetRegion = Region.KENYA;
      } else {
        targetRegion = selectedRegions[Math.floor(Math.random() * selectedRegions.length)];
      }
      const targetCategory = categories[Math.floor(Math.random() * categories.length)];

      // --- STAGE 1: SCAN ---
      setPipelineStage(PipelineStage.SCANNING);
      addLog(`[INGESTOR] Scanning ${targetRegion} for ${targetCategory}...`, "action");

      const trendData = await fetchTrendingTopic(targetCategory, targetRegion);
      
      if (!trendData) {
        addLog(`[INGESTOR] No high-velocity trend found. Sleeping...`, "info");
        setPipelineStage(PipelineStage.IDLE);
        return;
      }

      // --- STAGE 2: RANK ---
      setPipelineStage(PipelineStage.RANKING);
      // Note: Ranking is implicitly done in the fetch step via prompt logic, but visualized here for process
      addLog(`[RANKER] Top candidate selected: "${trendData.topic.substring(0, 30)}..."`, "success");
      await new Promise(r => setTimeout(r, 800)); // Simulate processing time

      // --- STAGE 3: VERIFY ---
      setPipelineStage(PipelineStage.VERIFYING);
      addLog(`[VERIFIER] Cross-referencing ${trendData.sources.length} sources...`, "action");
      
      let article = await draftBriefing(trendData.topic, trendData.context, targetCategory, targetRegion, trendData.sources);
      
      if (article.verificationScore < 50) {
         addLog(`[RISK CONTROL] Topic rejected. Low verification score (${article.verificationScore}%).`, "error");
         setPipelineStage(PipelineStage.IDLE);
         return;
      }

      // --- STAGE 4: ART ---
      setPipelineStage(PipelineStage.GENERATING_ART);
      addLog(`[IMAGE GEN] Creating journalistic illustration...`, "action");
      const imageUrl = await generateBriefImage(article);
      if (imageUrl) {
        article = { ...article, imageUrl };
        addLog(`[IMAGE GEN] Visual asset created successfully.`, "success");
      } else {
        addLog(`[IMAGE GEN] Failed to generate image. Publishing text only.`, "error");
      }

      // --- STAGE 5: PUBLISH ---
      setPipelineStage(PipelineStage.PUBLISHING);
      setArticles(prev => [article, ...prev]);
      addLog(`[PUBLISHER] Brief published to feed: ${article.headline}`, "success");
      
      // Reset
      setTimeout(() => setPipelineStage(PipelineStage.IDLE), 2000);

    } catch (error: any) {
      addLog(`[SYSTEM FAILURE] Agent Cycle Error: ${error.message}`, "error");
      setPipelineStage(PipelineStage.IDLE);
    }
  }, [selectedRegions]);

  useEffect(() => {
    if (isAutoPilot) {
      addLog("Auto-Pilot Sequence Initiated. 24/7 Monitoring Active.", "success");
      runAgentCycle();
      autoPilotRef.current = setInterval(runAgentCycle, 60000); // Check every 60s
    } else {
      if (autoPilotRef.current) {
        clearInterval(autoPilotRef.current);
        addLog("Auto-Pilot Disengaged. System Idle.", "info");
        setPipelineStage(PipelineStage.IDLE);
      }
    }

    return () => {
      if (autoPilotRef.current) clearInterval(autoPilotRef.current);
    };
  }, [isAutoPilot, runAgentCycle]);

  const toggleRegion = (region: Region) => {
    setSelectedRegions(prev => 
      prev.includes(region) 
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col font-sans">
      <Header isConnected={isConnected} onConnect={isConnected ? handleDisconnect : handleConnect} />

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Controls & Logs */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-brand-dark border border-brand-secondary p-5 rounded-sm shadow-lg">
            <h2 className="text-white font-display font-bold text-lg mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Mission Control
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Region Focus</label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(Region).map(r => (
                    <button
                      key={r}
                      onClick={() => toggleRegion(r)}
                      className={`px-3 py-1 text-xs border rounded-sm transition-all ${
                        selectedRegions.includes(r)
                          ? 'bg-brand-secondary border-brand-accent text-white'
                          : 'border-brand-secondary text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-brand-secondary">
                <button
                  onClick={() => setIsAutoPilot(!isAutoPilot)}
                  className={`w-full py-4 rounded-sm font-display font-bold text-lg tracking-wide transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
                    isAutoPilot
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                      : 'bg-brand-accent hover:bg-[#b3e600] text-black'
                  }`}
                >
                  {isAutoPilot ? 'STOP AUTO-PILOT' : 'START AUTO-PILOT'}
                </button>
                <p className="text-[10px] text-gray-500 mt-2 text-center">
                  {isAutoPilot ? 'System running 24/7. Monitoring global feeds...' : 'System Standing By.'}
                </p>
              </div>
            </div>
          </div>

          <PipelineVisualizer currentStage={pipelineStage} />
          
          <LogConsole logs={logs} />
        </div>

        {/* Right Column: News Feed */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-display font-bold text-2xl">Live Wire</h2>
            <div className="text-xs text-gray-500 font-mono flex gap-4">
              <span>ACTIVE REGIONS: {selectedRegions.length}</span>
              <span>ITEMS: {articles.length}</span>
            </div>
          </div>

          {articles.length === 0 ? (
            <div className="border border-dashed border-brand-secondary rounded-sm p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 mb-4 text-brand-secondary">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                  <path d="M14 17H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Feed Empty</h3>
              <p className="text-gray-500 max-w-sm">
                Initialize the Auto-Pilot to start the Bold Briefing ingestion engine.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
