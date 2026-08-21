import React, { useState } from 'react';
import { 
  Compass, 
  Search, 
  Sun, 
  Moon, 
  Sparkles, 
  Layers, 
  ListOrdered, 
  Plus, 
  ChevronDown, 
  Github,
  LogIn,
  LogOut,
  ShieldCheck,
  CloudUpload,
  CloudDownload,
  Loader2,
  Bot,
  Brain
} from 'lucide-react';
import { ROADMAP_TOPICS, CATEGORY_DEFINITIONS } from '../data/roadmapData';
import { ViewMode } from '../types';

interface TopBarProps {
  currentTopicId: number;
  onSelectTopic: (topicId: number) => void;
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  savedResourcesCount: number;
  isAdmin?: boolean;
  userEmail?: string;
  onAddResourceClick: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onSyncDb?: () => Promise<void>;
  isSyncing?: boolean;
  onFetchDb?: () => Promise<void>;
  isFetching?: boolean;
  onOpenSageAi?: () => void;
  onOpenQuiz?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTopicId,
  onSelectTopic,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  theme,
  onToggleTheme,
  savedResourcesCount,
  isAdmin = false,
  userEmail,
  onAddResourceClick,
  onLoginClick,
  onLogoutClick,
  onSyncDb,
  isSyncing = false,
  onFetchDb,
  isFetching = false
}) => {
  const [showPathfinder, setShowPathfinder] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const currentTopic = ROADMAP_TOPICS.find(t => t.id === currentTopicId);

  return (
    <header className="h-16 min-h-[64px] border-b border-slate-800 flex items-center justify-between px-3 md:px-5 bg-[#0D1117] shrink-0 text-slate-300 font-sans z-30 sticky top-0 transition-colors gap-2 md:gap-4 select-none">
      {/* Left: Branding & Pathfinder */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="bg-gradient-to-tr from-amber-500 via-cyan-500 to-indigo-600 p-2 rounded-xl text-slate-950 shadow-md shadow-amber-500/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="shrink-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 whitespace-nowrap leading-none">
              <h1 className="text-lg md:text-xl font-black text-white tracking-tight leading-none whitespace-nowrap">
                Sage<span className="text-amber-400">Map</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                AI/ML
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium tracking-tight whitespace-nowrap hidden sm:block mt-0.5 leading-none">
              A roadmap for AI & ML
            </p>
          </div>
        </div>

        {/* Pathfinder Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowPathfinder(!showPathfinder)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-200 transition-all shadow-sm whitespace-nowrap"
            title="Jump to Topic"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden xl:inline text-slate-400">Jump:</span>
            <span className="font-bold text-amber-300 truncate max-w-[110px] md:max-w-[150px]">
              {currentTopic ? `Step ${currentTopic.stepNumber}: ${currentTopic.title}` : 'Jump to Step'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5 shrink-0" />
          </button>

          {showPathfinder && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowPathfinder(false)} 
              />
              <div className="absolute left-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl bg-[#0D1117] border border-slate-800 shadow-2xl p-2 z-50 divide-y divide-slate-800/80 custom-scrollbar">
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Curriculum Topics ({ROADMAP_TOPICS.length})
                </div>
                <div className="py-1 space-y-1">
                  {ROADMAP_TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => {
                        onSelectTopic(topic.id);
                        setShowPathfinder(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        currentTopicId === topic.id
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-800 text-amber-400 border border-slate-700">
                          {topic.stepNumber}
                        </span>
                        <span className="truncate">{topic.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {topic.resources.length} res
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Middle: Search & Filter */}
      <div className="hidden lg:flex items-center gap-2 max-w-xs xl:max-w-sm w-full mx-2 shrink">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search topics, tools, papers..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: View Switcher, Developer Links & Theme */}
      <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">
        {/* Developer Attribution Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono shrink-0 whitespace-nowrap">
          <span className="text-slate-500 text-[11px]">dev by</span>
          <a
            href="https://github.com/mdzaheerjk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline flex items-center gap-1 whitespace-nowrap"
            title="GitHub: mdzaheerjk"
          >
            <Github className="w-3.5 h-3.5" />
            <span>mdzaheerjk</span>
          </a>
        </div>

        {/* View Mode Switcher */}
        <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1 shrink-0">
          <button
            onClick={() => onViewModeChange('canvas')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              viewMode === 'canvas'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Interactive Visual Roadmap Canvas"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Roadmap</span>
          </button>

          <button
            onClick={() => onViewModeChange('matrix')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              viewMode === 'matrix'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Curriculum Matrix View"
          >
            <ListOrdered className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Matrix</span>
          </button>

          <button
            onClick={() => onViewModeChange('explorer')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              viewMode === 'explorer'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Resource Discovery Catalog"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Explorer</span>
          </button>
        </div>

        {/* SageAI Learning Assistant Button */}
        {onOpenSageAi && (
          <button
            onClick={onOpenSageAi}
            className="flex px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-500/40 text-xs font-bold text-amber-300 items-center gap-1.5 transition-all shadow-md shrink-0 whitespace-nowrap"
            title="Open SageAI Assistant & Code Generator"
          >
            <Bot className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden md:inline font-black">SageAI</span>
          </button>
        )}

        {/* Quiz & Flashcards Button */}
        {onOpenQuiz && (
          <button
            onClick={onOpenQuiz}
            className="flex px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-500/40 text-xs font-bold text-indigo-300 items-center gap-1.5 transition-all shadow-sm shrink-0 whitespace-nowrap"
            title="Open Active Recall Flashcards & MCQ Quiz"
          >
            <Brain className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden md:inline">Quiz</span>
          </button>
        )}

        {/* Fetch Data from Supabase Button (Available for all users / admins) */}
        {onFetchDb && (
          <button
            onClick={onFetchDb}
            disabled={isFetching}
            className="flex px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 border border-cyan-500/30 hover:border-cyan-400/60 text-xs font-bold text-cyan-300 items-center gap-1.5 transition-all shadow-sm shrink-0 whitespace-nowrap"
            title="Fetch latest learning resources directly from Supabase"
          >
            {isFetching ? (
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
            ) : (
              <CloudDownload className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            )}
            <span>{isFetching ? 'Fetching...' : 'Fetch Supabase'}</span>
          </button>
        )}

        {/* Admin action buttons */}
        {isAdmin && (
          <>
            {onSyncDb && (
              <button
                onClick={onSyncDb}
                disabled={isSyncing}
                className="hidden lg:flex px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 border border-slate-800 text-xs font-bold text-slate-200 items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
                title="Push current website resources and delete removed items in Supabase"
              >
                {isSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                ) : (
                  <CloudUpload className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span>{isSyncing ? 'Syncing...' : 'Sync DB'}</span>
              </button>
            )}

            <button
              onClick={onAddResourceClick}
              className="hidden md:flex px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
              title="Add Resource"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Add</span>
            </button>
          </>
        )}

        {/* Admin auth controls */}
        {isAdmin ? (
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-emerald-300 font-bold truncate max-w-[120px]">{userEmail || 'Admin'}</span>
            <button
              onClick={onLogoutClick}
              className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="hidden md:flex px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
            title="Admin sign in"
          >
            <LogIn className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Admin</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 transition-colors shrink-0"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>
      </div>
    </header>
  );
};
