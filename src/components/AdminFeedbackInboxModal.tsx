import React, { useState, useMemo } from 'react';
import { 
  X, 
  Inbox, 
  Star, 
  CheckCircle2, 
  Clock, 
  Archive, 
  Trash2, 
  Search, 
  Sparkles, 
  Bug, 
  BookOpen, 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  ExternalLink, 
  Download, 
  RefreshCw, 
  FileText, 
  ShieldCheck, 
  Layers, 
  ChevronRight, 
  StickyNote,
  Send,
  SlidersHorizontal,
  Check,
  Flame,
  AlertCircle
} from 'lucide-react';
import { 
  FeedbackItem, 
  FeedbackCategory, 
  FeedbackStatus, 
  FeedbackStats,
  RoadmapTopic 
} from '../types';
import { 
  updateFeedbackItem, 
  deleteFeedbackItem, 
  computeFeedbackStats 
} from '../services/feedbackService';

interface AdminFeedbackInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedbacks: FeedbackItem[];
  onRefreshFeedbacks: () => Promise<any>;
  topics: RoadmapTopic[];
  onSelectTopic?: (topicId: number) => void;
  onShowToast: (msg: string) => void;
}

type FilterFolder = 'all' | 'new' | 'starred' | 'in_progress' | 'resolved' | 'archived';

const CATEGORY_META: Record<FeedbackCategory, { label: string; icon: any; badgeClass: string; borderClass: string }> = {
  feature: {
    label: 'Feature Request',
    icon: Sparkles,
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    borderClass: 'border-amber-500/40'
  },
  content: {
    label: 'Content / Resource',
    icon: BookOpen,
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    borderClass: 'border-cyan-500/40'
  },
  bug: {
    label: 'Bug Report',
    icon: Bug,
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    borderClass: 'border-rose-500/40'
  },
  question: {
    label: 'Question',
    icon: HelpCircle,
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    borderClass: 'border-purple-500/40'
  },
  general: {
    label: 'General Feedback',
    icon: MessageSquare,
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    borderClass: 'border-emerald-500/40'
  }
};

const STATUS_META: Record<FeedbackStatus, { label: string; bg: string; text: string; border: string }> = {
  new: {
    label: 'New',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/40'
  },
  in_progress: {
    label: 'In Review',
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    border: 'border-purple-500/40'
  },
  resolved: {
    label: 'Resolved',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40'
  },
  archived: {
    label: 'Archived',
    bg: 'bg-slate-800/80',
    text: 'text-slate-400',
    border: 'border-slate-700/60'
  }
};

function formatRelativeTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;

    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}

export const AdminFeedbackInboxModal: React.FC<AdminFeedbackInboxModalProps> = ({
  isOpen,
  onClose,
  feedbacks,
  onRefreshFeedbacks,
  topics,
  onSelectTopic,
  onShowToast
}) => {
  const [selectedFolder, setSelectedFolder] = useState<FilterFolder>('all');
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest_rated' | 'lowest_rated'>('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isConfirmBatchDeleteOpen, setIsConfirmBatchDeleteOpen] = useState<boolean>(false);

  // Compute live inbox stats
  const stats: FeedbackStats = useMemo(() => {
    return computeFeedbackStats(feedbacks);
  }, [feedbacks]);

  // Filtered feedbacks list
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      // 1. Folder filter
      if (selectedFolder === 'new' && item.status !== 'new') return false;
      if (selectedFolder === 'in_progress' && item.status !== 'in_progress') return false;
      if (selectedFolder === 'resolved' && item.status !== 'resolved') return false;
      if (selectedFolder === 'archived' && item.status !== 'archived') return false;
      if (selectedFolder === 'starred' && !item.isStarred) return false;

      // 2. Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const msgMatch = item.message.toLowerCase().includes(q);
        const nameMatch = item.userName?.toLowerCase().includes(q) || false;
        const emailMatch = item.userEmail?.toLowerCase().includes(q) || false;
        const topicMatch = item.topicId ? `step ${item.topicId}`.includes(q) : false;
        if (!msgMatch && !nameMatch && !emailMatch && !topicMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'highest_rated') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'lowest_rated') {
        return (a.rating || 0) - (b.rating || 0);
      }
      return 0;
    });
  }, [feedbacks, selectedFolder, selectedCategory, searchQuery, sortBy]);

  // Active selected feedback object
  const activeItem = useMemo(() => {
    if (!selectedFeedbackId) {
      return filteredFeedbacks[0] || null;
    }
    return feedbacks.find((f) => f.id === selectedFeedbackId) || filteredFeedbacks[0] || null;
  }, [selectedFeedbackId, feedbacks, filteredFeedbacks]);

  // Sync admin note input with active item
  React.useEffect(() => {
    if (activeItem) {
      setAdminNoteInput(activeItem.adminNotes || '');
    }
  }, [activeItem?.id, activeItem?.adminNotes]);

  // Auto-select first item when folder changes
  React.useEffect(() => {
    if (filteredFeedbacks.length > 0) {
      if (!selectedFeedbackId || !filteredFeedbacks.some(f => f.id === selectedFeedbackId)) {
        setSelectedFeedbackId(filteredFeedbacks[0].id);
      }
    } else {
      setSelectedFeedbackId(null);
    }
  }, [selectedFolder, selectedCategory, filteredFeedbacks]);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshFeedbacks();
      onShowToast('Refreshed feedback inbox.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleStar = async (item: FeedbackItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextStar = !item.isStarred;
    await updateFeedbackItem(item.id, { isStarred: nextStar });
    onRefreshFeedbacks();
    onShowToast(nextStar ? 'Starred feedback' : 'Unstarred feedback');
  };

  const handleUpdateStatus = async (item: FeedbackItem, newStatus: FeedbackStatus) => {
    await updateFeedbackItem(item.id, { status: newStatus });
    onRefreshFeedbacks();
    onShowToast(`Marked feedback as ${STATUS_META[newStatus].label}`);
  };

  const handleSaveAdminNotes = async () => {
    if (!activeItem) return;
    setIsSavingNotes(true);
    try {
      await updateFeedbackItem(activeItem.id, { adminNotes: adminNoteInput });
      onRefreshFeedbacks();
      onShowToast('Saved admin notes.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleExecuteDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteFeedbackItem(id);
      await onRefreshFeedbacks();
      if (selectedFeedbackId === id) {
        setSelectedFeedbackId(null);
      }
      onShowToast('Feedback deleted permanently.');
    } catch (err) {
      console.error(err);
      onShowToast('Failed to delete feedback.');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleBatchDeleteResolved = async () => {
    const resolvedItems = feedbacks.filter((f) => f.status === 'resolved' || f.status === 'archived');
    if (resolvedItems.length === 0) {
      onShowToast('No completed/resolved feedbacks to delete.');
      return;
    }

    setDeletingId('batch');
    try {
      for (const item of resolvedItems) {
        await deleteFeedbackItem(item.id);
      }
      await onRefreshFeedbacks();
      setSelectedFeedbackId(null);
      onShowToast(`Deleted ${resolvedItems.length} completed feedback items.`);
    } catch (err) {
      console.error(err);
      onShowToast('Error deleting completed feedbacks.');
    } finally {
      setDeletingId(null);
      setIsConfirmBatchDeleteOpen(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(feedbacks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sagemap_feedback_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('Exported feedback data as JSON');
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Category', 'Status', 'Rating', 'Topic ID', 'User Name', 'User Email', 'Message', 'Admin Notes', 'Created At'];
    const rows = feedbacks.map(f => [
      `"${f.id}"`,
      `"${f.category}"`,
      `"${f.status}"`,
      f.rating || '',
      f.topicId || '',
      `"${(f.userName || '').replace(/"/g, '""')}"`,
      `"${(f.userEmail || '').replace(/"/g, '""')}"`,
      `"${f.message.replace(/"/g, '""')}"`,
      `"${(f.adminNotes || '').replace(/"/g, '""')}"`,
      `"${f.createdAt}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `sagemap_feedback_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('Exported feedback as CSV');
  };

  const activeTopic = activeItem?.topicId ? topics.find(t => t.id === activeItem.topicId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity" 
      />

      {/* Main Full-Scale Inbox Window */}
      <div className="relative w-full max-w-7xl h-[94vh] flex flex-col bg-[#0D1117]/95 border border-slate-750/90 rounded-3xl shadow-2xl shadow-black/80 backdrop-blur-2xl overflow-hidden z-10 text-slate-200 font-sans">
        
        {/* ========================================================================= */}
        {/* TOP TOOLBAR: Brand Header, Stats Overview, Search & Export Actions        */}
        {/* ========================================================================= */}
        <header className="px-4 sm:px-6 py-3.5 border-b border-slate-800/90 bg-gradient-to-r from-slate-950 via-[#0D1117] to-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Left Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-md shadow-amber-500/10">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white font-heading tracking-tight flex items-center gap-2">
                  Feedback & Triage Inbox
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/35 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  Admin Only
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Manage user suggestions, curriculum ratings, bug reports & community ideas
              </p>
            </div>
          </div>

          {/* Center Metric Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400 text-[10px]">Total:</span>
              <span className="text-white font-bold">{stats.total}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs font-mono">
              <span className="text-amber-400 text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                New:
              </span>
              <span className="text-amber-300 font-black">{stats.newCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-xs font-mono">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-300 font-bold">{stats.avgRating} / 5</span>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Batch Delete Completed Button (when resolved or archived exist) */}
            {(stats.resolvedCount > 0 || stats.archivedCount > 0) && (
              <button
                onClick={() => setIsConfirmBatchDeleteOpen(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-xs font-bold text-rose-300 border border-rose-500/40 flex items-center gap-1.5 transition-all shadow-sm"
                title="Delete all resolved and archived feedbacks"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Delete Completed</span>
                <span className="px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-mono font-black">
                  {stats.resolvedCount + stats.archivedCount}
                </span>
              </button>
            )}

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              title="Refresh Feedback Feed"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Export Dropdown / Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleExportCsv}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-[11px] font-bold text-slate-300 hover:text-cyan-300 border border-slate-800 flex items-center gap-1.5 transition-colors"
                title="Export as CSV spreadsheet"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportJson}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-[11px] font-bold text-slate-300 hover:text-amber-300 border border-slate-800 flex items-center gap-1.5 transition-colors"
                title="Export raw JSON"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>JSON</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors ml-1"
              title="Close Inbox"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* MAIN BODY: 3-PANE LAYOUT (Folders -> Feed List -> Detail & Triage Pane)    */}
        {/* ========================================================================= */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ----------------------------------------------------------------------- */}
          {/* PANE 1: FOLDERS & CATEGORIES NAVIGATION                                 */}
          {/* ----------------------------------------------------------------------- */}
          <nav className="w-56 border-r border-slate-800/80 bg-slate-950/70 p-3 flex flex-col justify-between shrink-0 hidden md:flex">
            <div className="space-y-4">
              
              {/* Folders / Views */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 px-2.5 block mb-1">
                  Folders
                </span>

                <button
                  onClick={() => { setSelectedFolder('all'); setSelectedCategory('all'); }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    selectedFolder === 'all' && selectedCategory === 'all'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Inbox className="w-4 h-4 text-slate-400" />
                    <span>All Feedback</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                    {stats.total}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedFolder('new')}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    selectedFolder === 'new'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Flame className={`w-4 h-4 ${selectedFolder === 'new' ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span>New / Unread</span>
                  </div>
                  <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md ${
                    selectedFolder === 'new' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {stats.newCount}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedFolder('starred')}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    selectedFolder === 'starred'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span>Starred</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-yellow-400">
                    {stats.starredCount}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedFolder('in_progress')}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    selectedFolder === 'in_progress'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>In Review</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                    {stats.inProgressCount}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedFolder('resolved')}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    selectedFolder === 'resolved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Resolved</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-emerald-400">
                    {stats.resolvedCount}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedFolder('archived')}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    selectedFolder === 'archived'
                      ? 'bg-slate-800 text-slate-200 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Archive className="w-4 h-4 text-slate-400" />
                    <span>Archived</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                    {stats.archivedCount}
                  </span>
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-1 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 px-2.5 block mb-1">
                  Categories
                </span>

                {(['feature', 'content', 'bug', 'question', 'general'] as FeedbackCategory[]).map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const Icon = meta.icon;
                  const count = stats.byCategory[cat];
                  const isSelected = selectedCategory === cat;

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-slate-850 text-white font-bold border border-slate-700'
                          : 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{meta.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Tip Card */}
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Inbox Realtime</span>
              </div>
              <p className="text-[10.5px] leading-tight">
                New user feedback will instantly populate this inbox via Supabase Realtime.
              </p>
            </div>
          </nav>

          {/* ----------------------------------------------------------------------- */}
          {/* PANE 2: FEED LIST & SEARCH BAR                                          */}
          {/* ----------------------------------------------------------------------- */}
          <div className="w-full md:w-96 lg:w-[420px] border-r border-slate-800/80 bg-slate-950/40 flex flex-col shrink-0">
            
            {/* Search & Sort Header */}
            <div className="p-3 border-b border-slate-800/80 space-y-2.5 bg-[#0D1117]/60 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search feedback, email, step..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900/90 border border-slate-750 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Filter Strip & Sort Dropdown */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-slate-400 font-semibold">
                  {filteredFeedbacks.length} {filteredFeedbacks.length === 1 ? 'message' : 'messages'}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-mono">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-amber-400"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest_rated">Highest Rated</option>
                    <option value="lowest_rated">Lowest Rated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Feed List Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {filteredFeedbacks.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400/80 shadow-md">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <div className="max-w-[260px]">
                    <h4 className="text-xs font-bold text-slate-200">
                      {searchQuery ? 'No Matching Feedback' : 'No Customer Feedback Yet'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {searchQuery 
                        ? 'Try clearing your search filters.' 
                        : 'Real-time submissions from learners and visitors will automatically appear here as they arrive.'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredFeedbacks.map((item) => {
                  const isSelected = activeItem?.id === item.id;
                  const catMeta = CATEGORY_META[item.category] || CATEGORY_META.general;
                  const statusMeta = STATUS_META[item.status] || STATUS_META.new;
                  const CatIcon = catMeta.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedFeedbackId(item.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer relative select-none ${
                        isSelected
                          ? 'bg-slate-900/95 border-amber-500/50 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
                          : 'bg-slate-900/40 border-slate-800/70 hover:bg-slate-900/80 hover:border-slate-700'
                      }`}
                    >
                      {/* New Item Amber Dot Indicator */}
                      {item.status === 'new' && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                      )}

                      {/* Header Row: Category Badge & Relative Time */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 shrink-0 ${catMeta.badgeClass}`}>
                            <CatIcon className="w-3 h-3" />
                            <span>{catMeta.label}</span>
                          </span>

                          {item.topicId && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[9.5px] font-mono text-slate-300 border border-slate-700 shrink-0">
                              Step {item.topicId}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-mono text-slate-500 shrink-0 pr-2">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      {/* Sender & Star Row */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-slate-200 truncate">
                            {item.userName || item.userEmail?.split('@')[0] || 'Anonymous Visitor'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Rating Stars */}
                          {item.rating && (
                            <div className="flex items-center text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span className="text-[10px] font-mono font-bold ml-0.5">{item.rating}</span>
                            </div>
                          )}

                          {/* Star Button */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleStar(item, e)}
                            className="p-1 text-slate-600 hover:text-yellow-400 transition-colors"
                            title={item.isStarred ? 'Starred' : 'Click to star'}
                          >
                            <Star className={`w-3.5 h-3.5 ${item.isStarred ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Message Snippet */}
                      <p className="text-[11.5px] text-slate-400 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Status Footer Pill & Actions */}
                      <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                        <span className={`px-2 py-0.5 rounded-md font-bold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                          {statusMeta.label}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {item.adminNotes && (
                            <span className="text-slate-400 flex items-center gap-1 italic text-[10px]">
                              <StickyNote className="w-3 h-3 text-amber-400" />
                              <span className="hidden sm:inline">Note</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(item.id);
                            }}
                            className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Feedback"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* PANE 3: DETAILED VIEW & TRIAGE ACTION CONTROLS                          */}
          {/* ----------------------------------------------------------------------- */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-[#090A0F]/90 custom-scrollbar">
            {activeItem ? (
              <div className="p-5 sm:p-7 space-y-6 max-w-3xl mx-auto w-full">
                
                {/* 1. Header & Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {/* Status Dropdown / Buttons */}
                    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800">
                      <button
                        onClick={() => handleUpdateStatus(activeItem, 'new')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          activeItem.status === 'new'
                            ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        New
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(activeItem, 'in_progress')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          activeItem.status === 'in_progress'
                            ? 'bg-purple-500 text-white font-black shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        In Review
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(activeItem, 'resolved')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          activeItem.status === 'resolved'
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Resolved
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(activeItem, 'archived')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          activeItem.status === 'archived'
                            ? 'bg-slate-700 text-slate-200 font-black shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Archive
                      </button>
                    </div>
                  </div>

                  {/* Priority & Delete Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStar(activeItem)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                        activeItem.isStarred
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${activeItem.isStarred ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                      <span>{activeItem.isStarred ? 'Starred' : 'Star'}</span>
                    </button>

                    <button
                      onClick={() => setConfirmDeleteId(activeItem.id)}
                      disabled={deletingId === activeItem.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                        activeItem.status === 'resolved' || activeItem.status === 'archived'
                          ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40 shadow-sm'
                          : 'bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border-slate-800 hover:border-rose-500/30'
                      }`}
                      title="Delete this feedback permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>{activeItem.status === 'resolved' || activeItem.status === 'archived' ? 'Delete Completed' : 'Delete'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Sender Profile & Metadata Box */}
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/70 border border-slate-800/90 shadow-xl space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-indigo-600 p-[1.5px] shadow-md shadow-amber-500/10">
                        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-base font-black text-amber-300 font-mono">
                          {(activeItem.userName || activeItem.userEmail || 'A').slice(0, 2).toUpperCase()}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-black text-white font-heading">
                            {activeItem.userName || 'Anonymous Visitor'}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${CATEGORY_META[activeItem.category].badgeClass}`}>
                            {CATEGORY_META[activeItem.category].label}
                          </span>
                        </div>

                        {activeItem.userEmail ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <a
                              href={`mailto:${activeItem.userEmail}?subject=Re:%20SageMap%20Feedback%20(${CATEGORY_META[activeItem.category].label})`}
                              className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-mono"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>{activeItem.userEmail}</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">No contact email provided</span>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-mono block">
                        {new Date(activeItem.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ID: {activeItem.id}
                      </span>
                    </div>
                  </div>

                  {/* Context Badges Bar: Rating & Topic */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
                    {/* Rating */}
                    {activeItem.rating && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= activeItem.rating!
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-mono">{activeItem.rating}/5 Stars</span>
                      </div>
                    )}

                    {/* Topic Link */}
                    {activeTopic && (
                      <button
                        onClick={() => {
                          if (onSelectTopic && activeTopic) {
                            onSelectTopic(activeTopic.id);
                            onClose();
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition-all group"
                        title="Click to view this Step in SageMap"
                      >
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>Step {activeTopic.stepNumber}: {activeTopic.title}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-white" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Full Message Content */}
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                    User Message & Feedback:
                  </h4>
                  <div className="text-sm sm:text-base text-slate-100 leading-relaxed whitespace-pre-wrap select-text font-sans">
                    {activeItem.message}
                  </div>
                </div>

                {/* 4. Quick Reply Action */}
                {activeItem.userEmail && (
                  <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
                      <div>
                        <h5 className="text-xs font-bold text-cyan-200">Want to reply directly to {activeItem.userName || 'this user'}?</h5>
                        <p className="text-[11px] text-cyan-400/80">Opens your default email client with a pre-filled subject line.</p>
                      </div>
                    </div>

                    <a
                      href={`mailto:${activeItem.userEmail}?subject=SageMap:%20Re:%20${encodeURIComponent(activeItem.message.slice(0, 40))}...`}
                      className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-cyan-500/20"
                    >
                      <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Reply Email</span>
                    </a>
                  </div>
                )}

                {/* 5. Admin Internal Notes & Resolution Log */}
                <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StickyNote className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-heading">
                        Admin Internal Notes
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Visible only to admins</span>
                  </div>

                  <textarea
                    rows={3}
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    placeholder="Add private triage notes, e.g.: 'Added fast.ai course to Step 04 catalog on 8/30' or 'Investigated broken link.'"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-750 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 custom-scrollbar resize-none"
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveAdminNotes}
                      disabled={isSavingNotes || adminNoteInput === (activeItem.adminNotes || '')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-bold text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isSavingNotes ? 'Saving...' : 'Save Note'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400/70 shadow-lg">
                  <Inbox className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-sm font-bold text-slate-200">
                    {filteredFeedbacks.length === 0 ? 'Live Real-Time Feedback Stream' : 'Select a Feedback Item'}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {filteredFeedbacks.length === 0 
                      ? 'Waiting for customer feedback. Submissions from users and learners will stream directly here in real-time.' 
                      : 'Choose any feedback item from the list on the left to read user suggestions, change triage status, or record private admin notes.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Single Item Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-rose-500/40 shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-heading">
                  Delete Customer Feedback?
                </h3>
                <p className="text-xs text-slate-400">
                  This action will permanently delete this completed feedback from the database.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
              <span className="font-mono text-slate-500 text-[10px]">Feedback Message:</span>
              <p className="line-clamp-3 italic text-slate-200">
                "{feedbacks.find(f => f.id === confirmDeleteId)?.message || 'Selected feedback'}"
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-300 transition-colors border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecuteDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingId === confirmDeleteId ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Resolved / Completed Confirmation Modal */}
      {isConfirmBatchDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-rose-500/40 shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-heading">
                  Delete All Completed Feedbacks?
                </h3>
                <p className="text-xs text-slate-400">
                  Permanently remove all {stats.resolvedCount + stats.archivedCount} resolved and archived feedbacks from the database.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300">
              <p className="font-medium">
                This will delete all completed customer reviews and requests that have been marked Resolved or Archived.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmBatchDeleteOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-300 transition-colors border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchDeleteResolved}
                disabled={deletingId === 'batch'}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingId === 'batch' ? 'Deleting...' : `Delete ${stats.resolvedCount + stats.archivedCount} Items`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
