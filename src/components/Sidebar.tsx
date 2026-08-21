import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Layers, 
  Compass, 
  ExternalLink,
  ChevronDown,
  BookOpen,
  ArrowRight,
  Github
} from 'lucide-react';
import { ROADMAP_TOPICS } from '../data/roadmapData';
import { RoadmapTopic } from '../types';

interface SidebarProps {
  currentTopicId: number;
  onSelectTopic: (topicId: number) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenTopicDashboard: (topicId: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTopicId,
  onSelectTopic,
  isOpen,
  onToggleOpen,
  onOpenTopicDashboard
}) => {
  const [expandedTopicId, setExpandedTopicId] = useState<number | null>(currentTopicId);

  const toggleExpand = (topicId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTopicId(prev => prev === topicId ? null : topicId);
  };

  return (
    <aside
      className={`h-full border-r border-slate-800/80 bg-[#0D1117]/90 backdrop-blur-xl transition-all duration-300 flex flex-col z-20 shrink-0 font-sans ${
        isOpen ? 'w-80' : 'w-16'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-14 border-b border-slate-800/80 flex items-center justify-between px-4 shrink-0">
        {isOpen ? (
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-300 font-heading">
              Curriculum Steps (1-{ROADMAP_TOPICS.length})
            </h2>
          </div>
        ) : (
          <Compass className="w-5 h-5 text-amber-400 mx-auto" />
        )}

        <button
          onClick={onToggleOpen}
          className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white transition-colors"
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Topics Navigation List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
        {ROADMAP_TOPICS.map((topic) => {
          const isCurrent = currentTopicId === topic.id;
          const isExpanded = expandedTopicId === topic.id;
          const totalRes = topic.resources.length;

          if (!isOpen) {
            return (
              <button
                key={topic.id}
                onClick={() => {
                  onSelectTopic(topic.id);
                  onOpenTopicDashboard(topic.id);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-amber-500/20 text-amber-300 font-mono font-black border border-amber-500/50 shadow-lg shadow-amber-500/10'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
                title={`Step ${topic.stepNumber}: ${topic.title}`}
              >
                <span className="text-xs font-mono font-bold">{topic.stepNumber}</span>
              </button>
            );
          }

          return (
            <div
              key={topic.id}
              className={`rounded-2xl transition-all border relative overflow-hidden ${
                isCurrent
                  ? 'bg-slate-900/95 border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'bg-transparent border-transparent hover:bg-slate-900/60 hover:border-slate-800/60'
              }`}
            >
              {/* Active Topic Accent Strip */}
              {isCurrent && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600" />
              )}

              {/* Step Header */}
              <div
                onClick={() => {
                  onSelectTopic(topic.id);
                  setExpandedTopicId(topic.id);
                }}
                className="p-3 flex items-center justify-between gap-2 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black shrink-0 ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                        : 'bg-slate-800/80 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    {topic.stepNumber}
                  </span>

                  <div className="min-w-0">
                    <h3 className={`text-xs font-bold truncate leading-snug ${isCurrent ? 'text-white font-extrabold' : 'text-slate-300'}`}>
                      {topic.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      {totalRes} resources • {topic.subtopics.length} subtopics
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => toggleExpand(topic.id, e)}
                    className="p-1 rounded-md text-slate-400 hover:text-white"
                  >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expandable Subtopics & Quick Action */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1.5 border-t border-slate-800/60 space-y-2.5">
                  <div className="space-y-1">
                    {topic.subtopics.slice(0, 4).map((sub) => (
                      <div
                        key={sub.id}
                        className="text-[11px] text-slate-400 pl-2.5 border-l border-slate-700/80 flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{sub.title}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTopicDashboard(topic.id);
                    }}
                    className="w-full py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-amber-500/35 shadow-sm"
                  >
                    <span>Open Learning Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer: SageMap & Developer Credits */}
      {isOpen ? (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 shrink-0 text-center">
          <div className="text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1.5 whitespace-nowrap">
            <span className="text-amber-400">SageMap</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 text-[10px]">AI/ML Roadmap</span>
          </div>
          <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10.5px] font-mono text-slate-400 whitespace-nowrap">
            <span>dev:</span>
            <a 
              href="https://github.com/mdzaheerjk" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline flex items-center gap-1"
              title="GitHub: mdzaheerjk"
            >
              <Github className="w-3 h-3" />
              mdzaheerjk
            </a>
          </div>
        </div>
      ) : (
        <div className="p-2 border-t border-slate-800 text-center shrink-0">
          <a
            href="https://github.com/mdzaheerjk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-amber-400 inline-block p-1"
            title="SageMap - Developed by mdzaheerjk"
          >
            <Github className="w-4 h-4 mx-auto" />
          </a>
        </div>
      )}
    </aside>
  );
};
