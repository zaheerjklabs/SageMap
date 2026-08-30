import React, { useState, useMemo, useEffect } from 'react';
import {
  X, MessageSquare, Plus, Search, ThumbsUp, CheckCircle, HelpCircle,
  Sparkles, ShieldCheck, GraduationCap, Send, Trash2, Tag,
  Filter, Check, ArrowRight, CornerDownRight, BookOpen, AlertCircle,
  Share2, RefreshCw, Layers, Flame, Code, User as UserIcon, LogIn
} from 'lucide-react';
import { CommunityPost, CommunityReply, CommunityCategory, RoadmapTopic } from '../types';
import {
  createCommunityPost,
  createCommunityReply,
  toggleUpvotePost,
  toggleUpvoteReply,
  toggleMarkSolution,
  deleteCommunityPost
} from '../services/communityService';
import { UserRole } from '../contexts/AuthContext';

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: CommunityPost[];
  onRefreshPosts: () => Promise<void>;
  topics: RoadmapTopic[];
  onSelectTopic: (topicId: number) => void;
  currentUser: {
    id?: string;
    email?: string;
    name?: string;
    role?: UserRole | null;
  } | null;
  onOpenAuthModal: () => void;
  onShowToast: (msg: string) => void;
}

const CATEGORY_CONFIG: Record<
  CommunityCategory,
  { label: string; icon: React.FC<{ className?: string }>; color: string; border: string; bg: string }
> = {
  question: {
    label: 'Question',
    icon: HelpCircle,
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10 text-amber-300'
  },
  help: {
    label: 'Help Request',
    icon: Flame,
    color: 'text-rose-400',
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10 text-rose-300'
  },
  discussion: {
    label: 'Discussion',
    icon: MessageSquare,
    color: 'text-cyan-400',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/10 text-cyan-300'
  },
  project: {
    label: 'Project Showcase',
    icon: Sparkles,
    color: 'text-purple-400',
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10 text-purple-300'
  },
  resource: {
    label: 'Resource Share',
    icon: BookOpen,
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10 text-emerald-300'
  }
};

const formatRelativeTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
};

export const CommunityModal: React.FC<CommunityModalProps> = ({
  isOpen,
  onClose,
  posts,
  onRefreshPosts,
  topics,
  onSelectTopic,
  currentUser,
  onOpenAuthModal,
  onShowToast
}) => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CommunityCategory | 'all'>('all');
  const [topicFilter, setTopicFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'upvotes' | 'replies' | 'unsolved'>('latest');

  // New Post Dialog State
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<CommunityCategory>('question');
  const [newTopicId, setNewTopicId] = useState<number | 'none'>('none');
  const [newTags, setNewTags] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Reply State
  const [replyInput, setReplyInput] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtered & Sorted Posts
  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        // Category filter
        if (categoryFilter !== 'all' && post.category !== categoryFilter) return false;

        // Topic filter
        if (topicFilter !== 'all') {
          if (post.topicId !== topicFilter) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const titleMatch = post.title.toLowerCase().includes(q);
          const contentMatch = post.content.toLowerCase().includes(q);
          const authorMatch = post.userName?.toLowerCase().includes(q) || post.userEmail?.toLowerCase().includes(q);
          const tagMatch = post.tags?.some((t) => t.toLowerCase().includes(q));
          if (!titleMatch && !contentMatch && !authorMatch && !tagMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'upvotes') {
          return b.upvotes - a.upvotes;
        }
        if (sortBy === 'replies') {
          return (b.replyCount || 0) - (a.replyCount || 0);
        }
        if (sortBy === 'unsolved') {
          if (a.isSolved === b.isSolved) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return a.isSolved ? 1 : -1;
        }
        // default latest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [posts, categoryFilter, topicFilter, searchQuery, sortBy]);

  // Active Post Selection
  const activePost = useMemo(() => {
    if (!selectedPostId) {
      return filteredPosts[0] || null;
    }
    return posts.find((p) => p.id === selectedPostId) || filteredPosts[0] || null;
  }, [posts, selectedPostId, filteredPosts]);

  // Auto-select first post if none selected
  useEffect(() => {
    if (filteredPosts.length > 0 && !selectedPostId) {
      setSelectedPostId(filteredPosts[0].id);
    }
  }, [filteredPosts, selectedPostId]);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshPosts();
      onShowToast('Community feed updated.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenNewPost = () => {
    if (!currentUser?.email) {
      onOpenAuthModal();
      onShowToast('Please sign in to ask a question or start a discussion.');
      return;
    }
    setIsNewPostOpen(true);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.email) {
      onOpenAuthModal();
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) {
      onShowToast('Please enter both a title and details.');
      return;
    }

    setIsSubmittingPost(true);
    try {
      const parsedTags = newTags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const res = await createCommunityPost({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name || currentUser.email.split('@')[0],
        userRole: currentUser.role || 'user',
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        topicId: newTopicId === 'none' ? undefined : Number(newTopicId),
        tags: parsedTags
      });

      if (res.data) {
        setSelectedPostId(res.data.id);
        setIsNewPostOpen(false);
        setNewTitle('');
        setNewContent('');
        setNewTags('');
        await onRefreshPosts();
        onShowToast('Discussion posted to community!');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Failed to post discussion.');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost) return;

    if (!currentUser?.email) {
      onOpenAuthModal();
      onShowToast('Please sign in to reply to this question.');
      return;
    }

    if (!replyInput.trim()) return;

    setIsSubmittingReply(true);
    try {
      await createCommunityReply({
        postId: activePost.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name || currentUser.email.split('@')[0],
        userRole: currentUser.role || 'user',
        content: replyInput.trim()
      });

      setReplyInput('');
      await onRefreshPosts();
      onShowToast('Reply posted successfully!');
    } catch (err) {
      console.error(err);
      onShowToast('Failed to post reply.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleToggleUpvotePost = async (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser?.email) {
      onOpenAuthModal();
      onShowToast('Sign in to upvote discussions.');
      return;
    }
    await toggleUpvotePost(postId, currentUser.email);
    onRefreshPosts();
  };

  const handleToggleUpvoteReply = async (replyId: string) => {
    if (!activePost) return;
    if (!currentUser?.email) {
      onOpenAuthModal();
      onShowToast('Sign in to upvote replies.');
      return;
    }
    await toggleUpvoteReply(activePost.id, replyId, currentUser.email);
    onRefreshPosts();
  };

  const handleToggleSolution = async (replyId: string) => {
    if (!activePost) return;
    const isOwner = currentUser?.email && activePost.userEmail === currentUser.email;
    const isAdmin = currentUser?.role === 'admin';
    if (!isOwner && !isAdmin) {
      onShowToast('Only the post author or an admin can mark solutions.');
      return;
    }
    await toggleMarkSolution(activePost.id, replyId);
    onRefreshPosts();
    onShowToast('Updated solution status.');
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this discussion?')) return;
    await deleteCommunityPost(postId);
    await onRefreshPosts();
    if (selectedPostId === postId) {
      setSelectedPostId(null);
    }
    onShowToast('Discussion deleted.');
  };

  const activeTopic = activePost?.topicId ? topics.find((t) => t.id === activePost.topicId) : null;
  const isPostAuthor = currentUser?.email && activePost?.userEmail === currentUser.email;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn font-sans">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity" />

      {/* Main Container */}
      <div className="relative w-full max-w-7xl h-[94vh] flex flex-col bg-[#0D1117]/95 border border-slate-750/90 rounded-3xl shadow-2xl shadow-black/90 backdrop-blur-2xl overflow-hidden z-10 text-slate-200">
        
        {/* ========================================================================= */}
        {/* TOP TOOLBAR: Brand Header, Stats, Actions & Search                        */}
        {/* ========================================================================= */}
        <header className="px-4 sm:px-6 py-3.5 border-b border-slate-800/90 bg-gradient-to-r from-slate-950 via-[#0D1117] to-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Left Title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white font-heading tracking-tight flex items-center gap-2">
                  SageMap Community & Q&A Hub
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Live Learners
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Ask questions, troubleshoot AI/ML code, share insights, and get help from mentors & peers
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              title="Refresh Community Feed"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {/* Ask Question / Post Button */}
            <button
              onClick={handleOpenNewPost}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Ask Question / Post</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="Close Community"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* BODY: 2-PANE DISCUSSIONS FEED & ACTIVE QUESTION THREAD                    */}
        {/* ========================================================================= */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ----------------------------------------------------------------------- */}
          {/* PANE 1: FEED LIST & FILTERS                                             */}
          {/* ----------------------------------------------------------------------- */}
          <div className="w-full md:w-[420px] lg:w-[460px] flex flex-col border-r border-slate-800/80 bg-[#090A0F]/70 shrink-0">
            
            {/* Search & Topic Filters */}
            <div className="p-3.5 border-b border-slate-800/80 space-y-2.5">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions, errors, tags..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Category Pills Rail */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                    categoryFilter === 'all'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  All ({posts.length})
                </button>
                {(Object.keys(CATEGORY_CONFIG) as CommunityCategory[]).map((catKey) => {
                  const cfg = CATEGORY_CONFIG[catKey];
                  const Icon = cfg.icon;
                  const count = posts.filter((p) => p.category === catKey).length;
                  return (
                    <button
                      key={catKey}
                      onClick={() => setCategoryFilter(catKey)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
                        categoryFilter === catKey
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                          : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{cfg.label}</span>
                      <span className="text-[9.5px] opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Step Dropdown & Sorting */}
              <div className="flex items-center justify-between gap-2 text-xs">
                {/* Step Filter */}
                <select
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-bold focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">All Roadmap Steps</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      Step {t.id}: {t.title.slice(0, 24)}...
                    </option>
                  ))}
                </select>

                {/* Sort Filter */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-bold focus:outline-none focus:border-cyan-400"
                >
                  <option value="latest">Latest</option>
                  <option value="upvotes">Most Upvoted</option>
                  <option value="replies">Most Active</option>
                  <option value="unsolved">Unsolved First</option>
                </select>
              </div>
            </div>

            {/* Posts Feed List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-cyan-400/80">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-xs mx-auto">
                    <h4 className="text-xs font-bold text-slate-200">
                      Live Community Stream
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Waiting for questions and discussions from learners and customers. Be the first to ask for help or share an insight!
                    </p>
                  </div>
                  <button
                    onClick={handleOpenNewPost}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Ask the First Question</span>
                  </button>
                </div>
              ) : (
                filteredPosts.map((post) => {
                  const isSelected = activePost?.id === post.id;
                  const catConfig = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.question;
                  const CatIcon = catConfig.icon;

                  return (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPostId(post.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-slate-900/95 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                          : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Solved Badge Indicator */}
                      {post.isSolved && (
                        <div className="absolute top-3.5 right-3.5 flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          <span>Solved</span>
                        </div>
                      )}

                      {/* Header Row: Category & Step Link */}
                      <div className="flex items-center gap-1.5 mb-1.5 pr-16">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border ${catConfig.border} ${catConfig.bg}`}>
                          <CatIcon className="w-3 h-3" />
                          <span>{catConfig.label}</span>
                        </span>

                        {post.topicId && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">
                            Step {post.topicId}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug mb-1.5 font-heading">
                        {post.title}
                      </h3>

                      {/* Content Snippet */}
                      <p className="text-[11.5px] text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                        {post.content}
                      </p>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {post.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-[9.5px] text-slate-400 font-mono">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer Row: Author, Upvotes, Replies & Time */}
                      <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                          <span className="font-bold text-slate-300 truncate">
                            {post.userName || post.userEmail?.split('@')[0]}
                          </span>
                          {post.userRole === 'admin' && (
                            <span className="px-1 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono font-black border border-amber-500/30">
                              Admin
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Upvotes */}
                          <div className="flex items-center gap-1 text-slate-300 font-bold">
                            <ThumbsUp className="w-3 h-3 text-cyan-400" />
                            <span>{post.upvotes}</span>
                          </div>

                          {/* Replies */}
                          <div className="flex items-center gap-1 text-slate-400 font-medium">
                            <MessageSquare className="w-3 h-3 text-slate-400" />
                            <span>{post.replyCount || 0}</span>
                          </div>

                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatRelativeTime(post.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* PANE 2: ACTIVE QUESTION THREAD & REPLIES                                */}
          {/* ----------------------------------------------------------------------- */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-[#090A0F]/90 custom-scrollbar">
            {activePost ? (
              <div className="p-5 sm:p-7 space-y-6 max-w-4xl mx-auto w-full">
                
                {/* 1. Post Header Box */}
                <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
                  
                  {/* Category, Topic Link & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${CATEGORY_CONFIG[activePost.category].border} ${CATEGORY_CONFIG[activePost.category].bg}`}>
                        {activePost.category.toUpperCase()}
                      </span>

                      {activeTopic && (
                        <button
                          onClick={() => {
                            onSelectTopic(activeTopic.id);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-xs font-mono font-bold text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-colors"
                          title="Jump to this roadmap step"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Step {activeTopic.id}: {activeTopic.title}</span>
                        </button>
                      )}
                    </div>

                    {/* Solved Status & Delete Action */}
                    <div className="flex items-center gap-2">
                      {activePost.isSolved ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Solved Question</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold">
                          Open for Answers
                        </span>
                      )}

                      {(isPostAuthor || isAdmin) && (
                        <button
                          onClick={() => handleDeletePost(activePost.id)}
                          className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 transition-colors"
                          title="Delete this discussion"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Post Title */}
                  <h2 className="text-base sm:text-xl font-black text-white font-heading leading-tight tracking-tight">
                    {activePost.title}
                  </h2>

                  {/* Author Profile Row */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 p-[1.5px]">
                        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xs font-black text-cyan-300 font-mono">
                          {(activePost.userName || activePost.userEmail || 'A').slice(0, 2).toUpperCase()}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">
                            {activePost.userName || activePost.userEmail?.split('@')[0]}
                          </span>
                          {activePost.userRole === 'admin' ? (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9.5px] font-mono font-black border border-amber-500/35">
                              Admin
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 text-[9.5px] font-mono font-bold border border-cyan-500/30">
                              Learner
                            </span>
                          )}
                        </div>
                        <span className="text-[10.5px] text-slate-500 font-mono">
                          Posted {formatRelativeTime(activePost.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Upvote Post Button */}
                    <button
                      onClick={(e) => handleToggleUpvotePost(activePost.id, e)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                        currentUser?.email && activePost.upvotedBy.includes(currentUser.email)
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md shadow-cyan-500/20'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{activePost.upvotes} Upvotes</span>
                    </button>
                  </div>

                  {/* Post Content Body */}
                  <div className="pt-2 text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {activePost.content}
                  </div>

                  {/* Tags */}
                  {activePost.tags && activePost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {activePost.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-cyan-300">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Replies / Discussion Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-cyan-400" />
                      <span>Community Answers & Replies ({activePost.replies?.length || 0})</span>
                    </h3>
                  </div>

                  {/* Reply List */}
                  {(!activePost.replies || activePost.replies.length === 0) ? (
                    <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                      <p className="text-xs text-slate-400 font-medium">
                        No replies yet. Be the first to provide help, share a code snippet, or answer!
                      </p>
                    </div>
                  ) : (
                    activePost.replies.map((reply) => {
                      const isReplyUpvoted = currentUser?.email && reply.upvotedBy.includes(currentUser.email);
                      return (
                        <div
                          key={reply.id}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                            reply.isSolution
                              ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                              : 'bg-slate-900/60 border-slate-800'
                          }`}
                        >
                          {/* Reply Top Header */}
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-cyan-300">
                                {(reply.userName || reply.userEmail || 'U').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-200">
                                    {reply.userName || reply.userEmail?.split('@')[0]}
                                  </span>
                                  {reply.userRole === 'admin' ? (
                                    <span className="px-1 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono font-black border border-amber-500/30">
                                      Admin
                                    </span>
                                  ) : (
                                    <span className="px-1 rounded bg-slate-800 text-slate-400 text-[9px] font-mono border border-slate-700">
                                      Learner
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {formatRelativeTime(reply.createdAt)}
                                </span>
                              </div>
                            </div>

                            {/* Solution Badge & Action */}
                            <div className="flex items-center gap-2">
                              {reply.isSolution && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Accepted Solution</span>
                                </span>
                              )}

                              {(isPostAuthor || isAdmin) && (
                                <button
                                  onClick={() => handleToggleSolution(reply.id)}
                                  className={`px-2 py-1 rounded-lg text-[10.5px] font-bold border transition-colors ${
                                    reply.isSolution
                                      ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                  }`}
                                  title="Mark as accepted solution"
                                >
                                  {reply.isSolution ? 'Unmark Solution' : 'Mark as Solution'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Reply Body */}
                          <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {reply.content}
                          </div>

                          {/* Reply Footer Action */}
                          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                            <button
                              onClick={() => handleToggleUpvoteReply(reply.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                                isReplyUpvoted
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>{reply.upvotes} Helpful</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 3. Reply Input Box */}
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
                  {currentUser?.email ? (
                    <form onSubmit={handleCreateReply} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-heading">
                          Your Answer / Reply
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Replying as: <strong className="text-cyan-300">{currentUser.name || currentUser.email}</strong>
                        </span>
                      </div>

                      <textarea
                        rows={3}
                        required
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        placeholder="Write your explanation, insights, or code snippet to help this learner..."
                        className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 resize-none custom-scrollbar"
                      />

                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] text-slate-500">
                          Supports multiline text and code blocks.
                        </span>
                        <button
                          type="submit"
                          disabled={isSubmittingReply || !replyInput.trim()}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmittingReply ? 'Posting...' : 'Post Reply'}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Guest Callout to Login */
                    <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                      <div>
                        <h4 className="text-xs font-bold text-cyan-200">
                          Sign in to Join the Community Discussion
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Only logged-in learners and mentors can post questions, upvote, and reply.
                        </p>
                      </div>
                      <button
                        onClick={onOpenAuthModal}
                        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-cyan-500/25 flex items-center gap-1.5 shrink-0"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In / Register</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400/70 shadow-lg">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-sm font-bold text-slate-200">
                    {filteredPosts.length === 0 ? 'Real-Time Community Feed' : 'Select a Discussion'}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {filteredPosts.length === 0
                      ? 'Real questions, answers, and help requests from learners and customers will appear here in real-time as they are posted.'
                      : 'Choose any question or discussion from the left feed to read community answers, upvote, and share solutions.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ASK QUESTION / NEW POST MODAL DIALOG                                      */}
      {/* ========================================================================= */}
      {isNewPostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-sans">
          <div className="w-full max-w-xl p-6 rounded-3xl bg-[#0D1117] border border-slate-750 shadow-2xl space-y-5 text-slate-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white font-heading">
                    Ask a Question / Post Help Request
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Get answers and guidance from the SageMap community
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewPostOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Post Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(CATEGORY_CONFIG) as CommunityCategory[]).map((catKey) => {
                    const cfg = CATEGORY_CONFIG[catKey];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setNewCategory(catKey)}
                        className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                          newCategory === catKey
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Linked Topic Step */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Related Roadmap Step (Optional)
                </label>
                <select
                  value={newTopicId}
                  onChange={(e) => setNewTopicId(e.target.value === 'none' ? 'none' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-bold focus:outline-none focus:border-cyan-400"
                >
                  <option value="none">General AI / ML (Not specific to one step)</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      Step {t.id}: {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Discussion Title / Question Summary
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. How do I choose learning rates in AdamW optimizer?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Content / Code Details */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Details, Error Logs & Context
                </label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Explain what you are trying to achieve, code snippets, or error tracebacks..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 resize-none custom-scrollbar"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g. PyTorch, AdamW, Optimization"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPostOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-300 transition-colors border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost || !newTitle.trim() || !newContent.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingPost ? 'Publishing...' : 'Publish Question'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
