import React from 'react';
import { 
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
  Code2,
  GraduationCap,
  Tv,
  FileText,
  BookOpen,
  Newspaper
} from 'lucide-react';
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
    <header className="sticky top-0 z-30 flex flex-col w-full bg-[#0D1117]/95 backdrop-blur-2xl text-slate-300 font-sans select-none shadow-xl shadow-black/40 border-b border-slate-800/90 transition-colors">
      {/* ========================================================================= */}
      {/* ROW 1: PRIMARY BRANDING & CENTERED ADMIN / ACTION CONTROLS TOOLBAR        */}
      {/* ========================================================================= */}
      <div className="h-14 min-h-[56px] px-3 sm:px-5 flex items-center justify-between border-b border-slate-800/60 gap-3">
        {/* Left: Logo & Branding */}
        <div 
          onClick={() => onViewModeChange('canvas')}
          className="flex items-center gap-2.5 shrink-0 group cursor-pointer"
        >
          <div className="bg-gradient-to-tr from-amber-500 via-amber-400 to-cyan-500 p-2 rounded-xl text-slate-950 shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-4 h-4 font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="shrink-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 whitespace-nowrap leading-none">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-none whitespace-nowrap font-heading">
                Sage<span className="text-gradient-amber">Map</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/35 whitespace-nowrap tracking-wide uppercase">
                AI / ML
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight whitespace-nowrap hidden sm:block mt-0.5 leading-none">
              A roadmap for AI & ML
            </p>
          </div>
        </div>

        {/* Center / Middle: byzaheerjk, Fetch, Sync, Add Resource, Admin/Logout (Cleanly Centered!) */}
        <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar px-2">
          {/* Developer Attribution Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono shrink-0 whitespace-nowrap shadow-sm">
            <span className="text-slate-400 text-[10px]">dev by</span>
            <a
              href="https://github.com/mdzaheerjk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline flex items-center gap-1 whitespace-nowrap text-[11px]"
              title="GitHub: mdzaheerjk"
            >
              <Github className="w-3 h-3" />
              <span>mdzaheerjk</span>
            </a>
          </div>

          {/* Fetch Data from Supabase Button */}
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
              <span>{isFetching ? 'Fetching...' : 'Fetch Supabase'}</span>
            </button>
          )}

          {/* Admin Tools: Sync DB & Add Resource */}
          {isAdmin && (
            <>
              {onSyncDb && (
                <button
                  onClick={onSyncDb}
                  disabled={isSyncing}
                  className="flex px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 disabled:opacity-60 border border-amber-500/40 hover:border-amber-400 text-xs font-bold text-amber-300 items-center gap-1.5 transition-all shrink-0 whitespace-nowrap shadow-sm"
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
                className="flex px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs items-center gap-1.5 transition-all shrink-0 whitespace-nowrap shadow-md shadow-amber-500/25"
                title="Add New Learning Resource"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                <span>Add Resource</span>
              </button>
            </>
          )}

          {/* Admin Auth Status / Login / Logout */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs shrink-0 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-300 font-bold truncate max-w-[80px] sm:max-w-[120px]">
                {userEmail?.split('@')[0] || 'Admin'}
              </span>
              <button
                onClick={onLogoutClick}
                className="p-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-1"
                title="Sign out as Admin"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] font-bold text-red-300 hidden md:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-750 hover:border-amber-500/40 text-xs font-bold text-slate-200 items-center gap-1.5 transition-all shrink-0 whitespace-nowrap shadow-sm"
              title="Admin sign in"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Admin</span>
            </button>
          )}
        </div>

        {/* Right side balance spacer */}
        <div className="w-8 shrink-0 hidden sm:block" />
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: DEDICATED CATEGORY NAVIGATION RAIL (Exact Custom Ordered!)         */}
      {/* ========================================================================= */}
      <div className="h-11 min-h-[44px] px-3 sm:px-5 flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar bg-[#090A0F]/80">
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 py-1">
          {/* 1. Roadmap */}
          <button
            onClick={() => onViewModeChange('canvas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
              viewMode === 'canvas'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Interactive Visual Roadmap Flowchart"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Roadmap</span>
          </button>

          {/* 2. All Resources */}
          <button
            onClick={() => onViewModeChange('explorer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
              viewMode === 'explorer'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="All Learning Resources"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>All Resources</span>
          </button>

          {/* 3. Courses */}
          <button
            onClick={() => onViewModeChange('courses')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
              viewMode === 'courses'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Curated Online Courses & Certifications"
          >
            <GraduationCap className="w-3.5 h-3.5 shrink-0 text-purple-400" />
            <span>Courses</span>
          </button>

          {/* 4. YouTube */}
          <button
            onClick={() => onViewModeChange('youtube')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
              viewMode === 'youtube'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="YouTube Masterclasses & Video Playlists"
          >
            <Tv className="w-3.5 h-3.5 shrink-0 text-red-400" />
            <span>YouTube</span>
          </button>

          {/* 5. GitHub */}
          <button
            onClick={() => onViewModeChange('github')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
              viewMode === 'github'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Open Source GitHub Repositories & Frameworks"
          >
            <Github className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span>GitHub</span>
          </button>

          {/* 6. Books */}
          <button
            onClick={() => onViewModeChange('books')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
              viewMode === 'books'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Essential Textbooks & Reference Books"
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>Books</span>
          </button>

          {/* 7. Papers */}
          <button
            onClick={() => onViewModeChange('papers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
              viewMode === 'papers'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Seminal Research Papers (arXiv, NeurIPS, ICML)"
          >
            <FileText className="w-3.5 h-3.5 shrink-0 text-teal-400" />
            <span>Papers</span>
          </button>

          {/* 8. Blogs */}
          <button
            onClick={() => onViewModeChange('blogs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
              viewMode === 'blogs'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Articles, Deep-dives & Technical Blogs"
          >
            <Newspaper className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
            <span>Blogs</span>
          </button>

          {/* 9. Projects */}
          <button
            onClick={() => onViewModeChange('projects')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
              viewMode === 'projects'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Hands-on AI & Agentic Projects"
          >
            <Code2 className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Projects</span>
          </button>
        </div>
      </div>
    </header>
  );
};
