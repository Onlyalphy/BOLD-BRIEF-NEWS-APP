import React from 'react';
import { NewsArticle } from '../types';

interface ArticleCardProps {
  article: NewsArticle;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const handleTweet = () => {
    // Twitter Intent API
    const text = encodeURIComponent(article.tweetDraft);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  return (
    <div className="bg-brand-dark border border-brand-secondary hover:border-brand-accent transition-colors duration-300 rounded-sm overflow-hidden flex flex-col group shadow-lg">
      
      {/* Generated Image Section */}
      {article.imageUrl && (
        <div className="relative w-full h-48 md:h-64 overflow-hidden border-b border-brand-secondary">
           <img 
            src={article.imageUrl} 
            alt={article.headline}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
           />
           <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-2 py-1 bg-black/80 text-brand-accent text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
                 {article.category}
              </span>
           </div>
        </div>
      )}

      <div className="p-6 flex flex-col gap-4">
        {/* Meta Header */}
        <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
            <span className={`w-2 h-2 rounded-full animate-pulse ${article.status === 'developing' ? 'bg-red-500' : 'bg-green-500'}`}></span>
            <span className="text-[10px] uppercase tracking-widest text-brand-accent font-bold">
                {article.status === 'developing' ? 'DEVELOPING STORY' : 'VERIFIED BRIEF'}
            </span>
            </div>
            <span className="text-xs text-gray-500 font-mono">
            {new Date(article.timestamp).toLocaleTimeString()}
            </span>
        </div>

        {/* Content */}
        <div>
            <h3 className="text-xl md:text-2xl font-display font-bold text-white leading-tight mb-3">
                {article.headline}
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed font-sans border-l-2 border-brand-accent pl-4">
                {article.summary}
            </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-t border-brand-secondary mt-2">
             <div className="flex flex-wrap gap-3">
                {article.sources.map((source, idx) => (
                    <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-gray-400 hover:text-brand-accent truncate transition-colors"
                    >
                    ↗ {source.title}
                    </a>
                ))}
             </div>
             
             <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-500 uppercase">Impact Score</span>
                    <span className="text-brand-accent font-mono font-bold">{article.rankingScore || 85}</span>
                </div>
                <button
                onClick={handleTweet}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-sm text-xs font-bold transition-all"
                >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Post
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
