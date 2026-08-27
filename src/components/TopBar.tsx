import React from 'react';
import { 
  Sun, 
  Moon, 
  Sparkles, 
  Layers, 
  Plus, 
  Github,
  LogIn,
  LogOut,
  ShieldCheck,
  CloudUpload,
  CloudDownload,
  Loader2,
  Bot,
  Code2,
  GraduationCap,
  Tv,
  FileText,
  BookOpen,
  Newspaper
} from 'lucide-react';
import { ROADMAP_TOPICS } from '../data/roadmapData';
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
  isFetching = false,
  onOpenSageAi
}) => {
  return (
    <header className="h-16 min-h-[64px] border-b border-slate-800/80 flex items-center justify-between px-3 md:px-5 bg-[#0D1117]/85 backdrop-blur-xl shrink-0 text-slate-300 font-sans z-30 sticky top-0 transition-colors gap-2 md:gap-4 select-none shadow-lg shadow-black/40">
      {/* Left: Branding */}
      <div className="flex items-center gap-2.5 md:gap-3.5 shrink-0">
        <div 
          onClick={() => onViewModeChange('canvas')}
          className="flex items-center gap-2.5 shrink-0 group cursor-pointer"
        >
          <div className="bg-gradient-to-tr from-amber-500 via-amber-400 to-cyan-500 p-2 rounded-xl text-slate-950 shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-5 h-5 font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="shrink-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 whitespace-nowrap leading-none">
              <h1 className="text-lg md:text-xl font-black text-white tracking-tight leading-none whitespace-nowrap font-heading">
                Sage<span className="text-gradient-amber">Map</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-mono font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/35 whitespace-nowrap tracking-wide uppercase">
                AI / ML
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight whitespace-nowrap hidden sm:block mt-1 leading-none">
              A roadmap for AI & ML
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Navigation Bar with Dedicated Category Tabs */}
      <div className="flex-1 flex items-center justify-center overflow-x-auto custom-scrollbar px-2">
        <div className="bg-slate-900/90 border border-slate-700/60 p-1 rounded-2xl flex items-center gap-1 shrink-0 shadow-inner">
          <button
            onClick={() => onViewModeChange('canvas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              viewMode === 'canvas'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Interactive Visual Roadmap Flowchart"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Roadmap</span>
          </button>

          <button
            onClick={() => onViewModeChange('projects')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              viewMode === 'projects'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Hands-on AI & Agentic Projects"
          >
            <Code2 className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Projects</span>
          </button>

          <button
            onClick={() => onViewModeChange('courses')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              viewMode === 'courses'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Curated Online Courses & Certifications"
          >
            <GraduationCap className="w-3.5 h-3.5 shrink-0 text-purple-400" />
            <span>Courses</span>
          </button>

          <button
            onClick={() => onViewModeChange('youtube')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              viewMode === 'youtube'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="YouTube Masterclasses & Video Playlists"
          >
            <Tv className="w-3.5 h-3.5 shrink-0 text-red-400" />
            <span>YouTube</span>
          </button>

          <button
            onClick={() => onViewModeChange('github')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              viewMode === 'github'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Open Source GitHub Repositories & Frameworks"
          >
            <Github className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span>GitHub</span>
          </button>

          <button
            onClick={() => onViewModeChange('papers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              viewMode === 'papers'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Seminal Research Papers (arXiv, NeurIPS, ICML)"
          >
            <FileText className="w-3.5 h-3.5 shrink-0 text-teal-400" />
            <span>Papers</span>
          </button>

          <button
            onClick={() => onViewModeChange('books')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              viewMode === 'books'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Essential Textbooks & Reference Books"
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>Books</span>
          </button>

          <button
            onClick={() => onViewModeChange('blogs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              viewMode === 'blogs'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Articles, Deep-dives & Technical Blogs"
          >
            <Newspaper className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
            <span>Blogs</span>
          </button>

          <button
            onClick={() => onViewModeChange('explorer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              viewMode === 'explorer'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="All Learning Resources"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>All Resources</span>
          </button>
        </div>
      </div>

      {/* Right Controls: Supabase Actions, Developer Attribution, Admin Auth & Theme */}
      <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0 overflow-x-auto no-scrollbar">
        {/* Developer Attribution Pill */}
        <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/60 text-xs font-mono shrink-0 whitespace-nowrap">
          <span className="text-slate-400 text-[11px]">dev by</span>
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

        {/* Fetch Data from Supabase Button (Available for all users / admins) */}
        {onFetchDb && (
          <button
            onClick={onFetchDb}
            disabled={isFetching}
            className="flex px-2.5 sm:px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 disabled:opacity-60 border border-cyan-500/40 hover:border-cyan-400 text-xs font-bold text-cyan-300 items-center gap-1.5 transition-all shadow-sm shrink-0 whitespace-nowrap"
            title="Fetch latest learning resources directly from Supabase"
          >
            {isFetching ? (
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
            ) : (
              <CloudDownload className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            )}
            <span className="hidden md:inline">{isFetching ? 'Fetching...' : 'Fetch Supabase'}</span>
          </button>
        )}

        {/* Admin action buttons */}
        {isAdmin && (
          <>
            {onSyncDb && (
              <button
                onClick={onSyncDb}
                disabled={isSyncing}
                className="flex px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 disabled:opacity-60 border border-amber-500/40 hover:border-amber-400 text-xs font-bold text-amber-300 items-center gap-1.5 transition-all shrink-0 whitespace-nowrap"
                title="Push current website resources and delete removed items in Supabase"
              >
                {isSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                ) : (
                  <CloudUpload className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span className="hidden lg:inline">{isSyncing ? 'Syncing...' : 'Sync DB'}</span>
              </button>
            )}

            <button
              onClick={onAddResourceClick}
              className="flex px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/60 hover:border-slate-500 text-xs font-bold text-slate-200 items-center gap-1.5 transition-all shrink-0 whitespace-nowrap"
              title="Add Resource"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </>
        )}

        {/* Admin auth controls - ALWAYS VISIBLE! */}
        {isAdmin ? (
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-xs shrink-0 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-emerald-300 font-bold truncate max-w-[80px] sm:max-w-[120px] hidden sm:inline">{userEmail || 'Admin'}</span>
            <button
              onClick={onLogoutClick}
              className="p-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-1"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[10px] font-bold text-red-300 hidden md:inline">Logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/60 hover:border-amber-500/40 text-xs font-bold text-slate-200 items-center gap-1.5 transition-all shrink-0 whitespace-nowrap shadow-sm"
            title="Admin sign in"
          >
            <LogIn className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/60 text-slate-300 hover:text-amber-400 transition-all shrink-0 hover:border-amber-500/40"
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
