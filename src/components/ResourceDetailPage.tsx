import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Tv, 
  Github, 
  Globe, 
  FileText, 
  BookOpen, 
  Newspaper, 
  ExternalLink, 
  Star, 
  Bookmark, 
  Clock, 
  Sparkles,
  User,
  Edit3,
  Trash2,
  Code2,
  CheckCircle2,
  Share2,
  Check,
  Bot,
  Layers,
  GraduationCap,
  Play,
  Terminal,
  Send,
  Loader2,
  ChevronRight,
  ShieldCheck,
  BookMarked
} from 'lucide-react';
import { UdemyLogo } from './UdemyLogo';
import { CourseraLogo } from './CourseraLogo';
import { GitHubCardBanner } from './GitHubCardBanner';
import { UdemyCourseBanner } from './UdemyCourseBanner';
import { CourseraCourseBanner } from './CourseraCourseBanner';
import { ResourceItem, RoadmapTopic } from '../types';
import { getResourceThumbnail } from './ResourceCard';
import { deriveResourceDetails, getResourceSlug } from '../utils/resourcePageUtils';
import { GoogleGenAI } from '@google/genai';

interface ResourceDetailPageProps {
  resource: ResourceItem;
  parentTopic?: RoadmapTopic | null;
  allTopics: RoadmapTopic[];
  isSaved?: boolean;
  onToggleSave?: (resourceId: string) => void;
  onEdit?: (resource: ResourceItem) => void;
  onDelete?: (resource: ResourceItem) => void;
  onBack: () => void;
  onSelectTopic: (topicId: number) => void;
  onSelectResource: (resource: ResourceItem) => void;
  isAdmin?: boolean;
  onOpenSageAi?: (topicId: number) => void;
}

type TabType = 'overview' | 'prerequisites' | 'curriculum' | 'ai_tutor';

export const ResourceDetailPage: React.FC<ResourceDetailPageProps> = ({
  resource,
  parentTopic,
  allTopics,
  isSaved = false,
  onToggleSave,
  onEdit,
  onDelete,
  onBack,
  onSelectTopic,
  onSelectResource,
  isAdmin = false,
  onOpenSageAi
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copiedLink, setCopiedLink] = useState(false);

  // In-page AI Tutor interaction
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `Hello! I'm SageAI. Ask me anything about **${resource.title}**, implementation details, or architecture design!`
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const derived = deriveResourceDetails(resource, parentTopic);
  const thumbnailUrl = getResourceThumbnail(resource);

  // Scroll to top on mount or when resource changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveTab('overview');
  }, [resource.id]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#/resource/${resource.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleSendAiMessage = async (customText?: string) => {
    const textToSend = customText || aiPrompt;
    if (!textToSend.trim() || isAiLoading) return;

    const userMsg = textToSend.trim();
    setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    if (!customText) setAiPrompt('');
    setIsAiLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (window as any).VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        setAiMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: `💡 **${resource.title} Summary & Guidance**:\n\nThis project focuses on **${derived.whatYouWillLearn[0]}** using **${derived.techBadges.join(', ')}**.\n\nTo build this step-by-step:\n1. Initialize your project environment with Python 3.10+ and install dependencies.\n2. Set up the core data structures and pipeline models.\n3. Integrate external tools and multi-agent loops.\n4. Add comprehensive automated testing with pytest and Dockerize.\n\n*(Connect your Gemini API Key in \`.env.local\` to unlock unlimited dynamic AI tutor responses!)*`
          }
        ]);
        setIsAiLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const promptContext = `You are SageAI, an elite AI & Machine Learning tutor guiding a developer studying:
Resource: ${resource.title}
Type: ${resource.type}
Category: ${derived.categoryTag}
Technologies: ${derived.techBadges.join(', ')}
Description: ${resource.description}

User Question: ${userMsg}

Provide a concise, practical, technical answer with clean Markdown formatting, code snippets if appropriate, and actionable tips.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptContext
      });

      const replyText = response.text || 'I could not generate a response at this moment. Please try again.';
      setAiMessages(prev => [...prev, { role: 'assistant', text: replyText }]);
    } catch (err: any) {
      console.error('AI Tutor error:', err);
      setAiMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Could not reach AI service: ${err?.message || 'Network error'}. Please try again.`
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Other related resources from the same topic
  const relatedResources = (parentTopic?.resources || [])
    .filter(r => r.id !== resource.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Breadcrumb Header Bar */}
      <div className="border-b border-slate-800/80 bg-[#0D1117]/90 backdrop-blur-xl sticky top-16 z-20 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 text-xs font-bold text-slate-200 transition-all shadow-sm group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>
              {resource.type === 'project' ? 'Back to Projects' : 'Back to Resources'}
            </span>
          </button>

          {parentTopic && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>/</span>
              <button
                onClick={() => onSelectTopic(parentTopic.id)}
                className="hover:text-amber-300 transition-colors font-mono"
              >
                Step {parentTopic.stepNumber}: {parentTopic.title}
              </button>
              <span>/</span>
              <span className="text-slate-200 font-bold truncate max-w-[200px] md:max-w-[300px]">
                {resource.title}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Bookmark Button */}
          {onToggleSave && (
            <button
              onClick={() => onToggleSave(resource.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isSaved
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:border-slate-600 hover:text-white'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          )}

          {/* Share Link Button */}
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 text-xs font-bold text-slate-200 transition-all shadow-sm"
            title="Copy shareable direct link to clipboard"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(resource)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  title="Full Admin Edit (Title, Image, Links, Outcomes, Tags)"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit Resource</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(resource)}
                  className="p-1.5 rounded-xl bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-all text-xs font-bold"
                  title="Delete resource from database"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Header / Badges / Title / Overview */}
            <div className="space-y-4">
              {/* Badges Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-lg text-xs font-extrabold tracking-wider uppercase ${derived.badgeColor.bg} ${derived.badgeColor.text} border ${derived.badgeColor.border} shadow-sm`}>
                  {derived.categoryTag}
                </span>

                {resource.difficulty && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-slate-900 text-slate-300 border border-slate-700/80">
                    {resource.difficulty}
                  </span>
                )}

                {resource.type === 'project' && resource.projectTier && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-500/40">
                    {resource.projectTier} Project
                  </span>
                )}

                {resource.isCustom && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                    Custom Supabase
                  </span>
                )}

                {resource.isEdited && !resource.isCustom && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                    Edited Supabase
                  </span>
                )}
              </div>

              {/* Huge Crisp Title (matching Krish Naik's style) */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15] font-heading">
                {resource.title}
              </h1>

              {/* Description Paragraph */}
              <p className="text-sm md:text-base text-slate-300/90 leading-relaxed max-w-3xl">
                {resource.description}
              </p>

              {/* Quick Meta Row */}
              <div className="pt-2 flex items-center flex-wrap gap-4 md:gap-6 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <BookMarked className="w-4 h-4" />
                  <span>{derived.statsHighlight}</span>
                </div>

                {resource.channelName && (
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{resource.channelName}</span>
                  </div>
                )}

                {resource.author && (
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{resource.author}</span>
                  </div>
                )}

                {resource.instructor && (
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                    <span>{resource.instructor}</span>
                  </div>
                )}

                {resource.platform && (
                  <div className="flex items-center gap-1.5 text-purple-300">
                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                    <span>{resource.platform}</span>
                  </div>
                )}

                {resource.stars && (
                  <div className="flex items-center gap-1 text-emerald-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-emerald-400/40" />
                    <span>{resource.stars} Stars</span>
                  </div>
                )}

                {resource.rating && (
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{resource.rating} Rating</span>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Tabs (Overview, Prerequisites, Curriculum, SageAI Tutor) */}
            <div className="border-b border-slate-800">
              <nav className="flex items-center gap-4 sm:gap-8 overflow-x-auto custom-scrollbar">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-3.5 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap ${
                    activeTab === 'overview'
                      ? 'text-amber-400 border-b-2 border-amber-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Overview
                </button>

                <button
                  onClick={() => setActiveTab('prerequisites')}
                  className={`pb-3.5 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap ${
                    activeTab === 'prerequisites'
                      ? 'text-amber-400 border-b-2 border-amber-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Prerequisites
                </button>

                <button
                  onClick={() => setActiveTab('curriculum')}
                  className={`pb-3.5 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap ${
                    activeTab === 'curriculum'
                      ? 'text-amber-400 border-b-2 border-amber-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Curriculum & Guide
                </button>

                <button
                  onClick={() => setActiveTab('ai_tutor')}
                  className={`pb-3.5 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'ai_tutor'
                      ? 'text-amber-400 border-b-2 border-amber-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Bot className="w-4 h-4 text-amber-400" />
                  <span>SageAI Tutor</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                    Live
                  </span>
                </button>
              </nav>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fadeIn">
                {/* "What You Will Learn" (2-column green checkmark grid matching Krish Naik UI!) */}
                <div className="p-6 md:p-8 rounded-3xl bg-[#0D1117]/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-6">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                      What You Will Learn
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    {derived.whatYouWillLearn.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.2]" />
                        </div>
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technologies & Tools Used */}
                <div className="p-6 md:p-8 rounded-3xl bg-[#0D1117]/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
                      Technologies & Libraries
                    </h2>
                  </div>

                  <div className="flex items-center flex-wrap gap-2.5">
                    {derived.techBadges.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 text-slate-200 border border-slate-700/80 text-xs font-mono font-bold hover:border-amber-400/60 hover:text-amber-300 transition-colors shadow-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Architecture Highlights & Best Practices */}
                <div className="p-6 md:p-8 rounded-3xl bg-[#0D1117]/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
                      Key Highlights & Architecture
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {derived.architectureHighlights.map((highlight, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3"
                      >
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                          {highlight}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PREREQUISITES */}
            {activeTab === 'prerequisites' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="p-6 md:p-8 rounded-3xl bg-[#0D1117]/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-6">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-black text-white tracking-tight">
                      Prerequisites & Recommended Knowledge
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {derived.prerequisitesList.map((prereq, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-start gap-3.5"
                      >
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
                          {prereq}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {parentTopic && (
                  <div className="p-6 md:p-8 rounded-3xl bg-[#0D1117]/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-4">
                    <h3 className="text-lg font-black text-white">
                      Recommended Prior Roadmap Steps
                    </h3>
                    <p className="text-xs text-slate-400">
                      To gain the maximum value from this project, we recommend reviewing foundational topics:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {allTopics.slice(0, 3).map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => onSelectTopic(topic.id)}
                          className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 text-left transition-all flex items-center justify-between group"
                        >
                          <div>
                            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                              Step {topic.stepNumber}
                            </span>
                            <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                              {topic.title}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CURRICULUM & GUIDE */}
            {activeTab === 'curriculum' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-6 md:p-8 rounded-3xl bg-[#0D1117]/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-black text-white tracking-tight">
                        Structured Curriculum & Modules
                      </h2>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                      {derived.curriculum.length} Modules
                    </span>
                  </div>

                  <div className="space-y-4">
                    {derived.curriculum.map((mod, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h3 className="text-sm md:text-base font-extrabold text-slate-100 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            <span>{mod.title}</span>
                          </h3>
                          {mod.duration && (
                            <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                              ⏱️ {mod.duration}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {mod.description}
                        </p>

                        <div className="flex items-center flex-wrap gap-2 pt-1">
                          {mod.topics.map((t, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-950/80 text-amber-300/90 border border-slate-800"
                            >
                              • {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* External Resource Action */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-4">
                    <p className="text-xs text-slate-400">
                      Ready to start? Launch the official resource repository / material:
                    </p>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                      <span>{derived.ctaText}</span>
                      <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SAGEAI TUTOR (INTEGRATED INTERACTIVE CHAT) */}
            {activeTab === 'ai_tutor' && (
              <div className="p-6 md:p-8 rounded-3xl bg-[#0D1117]/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-black text-white">
                        SageAI Project Assistant
                      </h2>
                      <p className="text-xs text-slate-400">
                        Ask questions, explore code implementation, or get guided debugging.
                      </p>
                    </div>
                  </div>

                  {onOpenSageAi && parentTopic && (
                    <button
                      onClick={() => onOpenSageAi(parentTopic.id)}
                      className="text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1"
                    >
                      <span>Full Tutor Drawer</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick Prompt Chips */}
                <div className="flex items-center flex-wrap gap-2">
                  {[
                    'Explain the high-level architecture of this project',
                    'How would you architect and deploy this in production?',
                    'How do I run and test this code locally?',
                    'What are common pitfalls and optimization tips?'
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendAiMessage(chip)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/70 hover:border-amber-500/40 text-[11px] font-bold text-slate-300 hover:text-amber-300 transition-all text-left"
                    >
                      💡 {chip}
                    </button>
                  ))}
                </div>

                {/* Chat History Container */}
                <div className="max-h-96 overflow-y-auto space-y-4 p-4 rounded-2xl bg-[#05070B] border border-slate-800/80 custom-scrollbar">
                  {aiMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 font-medium'
                            : 'bg-slate-900 text-slate-200 border border-slate-800'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {isAiLoading && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 font-mono py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>SageAI is generating response...</span>
                    </div>
                  )}
                </div>

                {/* Input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendAiMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={`Ask SageAI about ${resource.title}...`}
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700/80 focus:border-amber-400 focus:outline-none text-xs text-slate-100 placeholder-slate-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!aiPrompt.trim() || isAiLoading}
                    className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Sticky Master Card (Krish Naik Style!) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="rounded-3xl bg-[#0D1117]/95 border border-slate-800/90 shadow-2xl overflow-hidden backdrop-blur-xl">
              
              {/* Thumbnail / Cover Image with overlay tag */}
              <div className={`relative w-full aspect-video bg-[#05070B] overflow-hidden group ${
                resource.type === 'book' ? 'p-3 bg-[#06090E] flex items-center justify-center' : ''
              }`}>
                {(resource.imageUrl || resource.thumbnailUrl) ? (
                  <img
                    src={resource.imageUrl || resource.thumbnailUrl}
                    alt={resource.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop';
                    }}
                    className={`w-full h-full ${resource.type === 'book' ? 'object-contain drop-shadow-xl' : 'object-cover'} group-hover:scale-105 transition-transform duration-500`}
                  />
                ) : resource.type === 'github' || (resource.type !== 'project' && resource.url && resource.url.includes('github.com')) ? (
                  <GitHubCardBanner resource={resource} />
                ) : (resource.type === 'course' && (resource.url?.includes('coursera.org') || resource.platform === 'Coursera')) ? (
                  <CourseraCourseBanner resource={resource} />
                ) : (resource.type === 'course' && (resource.url?.includes('udemy.com') || resource.platform === 'Udemy')) ? (
                  <UdemyCourseBanner resource={resource} />
                ) : (
                  <>
                    <img
                      src={thumbnailUrl}
                      alt={resource.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop';
                      }}
                      className={`w-full h-full ${resource.type === 'book' ? 'object-contain drop-shadow-xl p-2' : 'object-contain'} group-hover:scale-105 transition-transform duration-500`}
                    />

                    {/* Tag overlay matching Krish Naik screenshot */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-950/90 text-amber-300 border border-amber-500/40 shadow-lg backdrop-blur-md">
                        {derived.categoryTag.split('&')[0]}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-6">
                
                {/* Price / Access Tier */}
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">
                    {derived.accessBadge}
                  </h3>
                  <p className="text-xs text-slate-400 leading-snug">
                    {derived.accessNote}
                  </p>
                </div>

                {/* Primary Action Button ("Start Project ↗") */}
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{derived.ctaText}</span>
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                </a>

                {/* Specifications List */}
                <div className="border-t border-slate-800/80 pt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Access</span>
                    <span className="text-slate-200 font-bold">Mobile & Web</span>
                  </div>

                  {resource.difficulty && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Level</span>
                      <span className="text-amber-300 font-bold">{resource.difficulty}</span>
                    </div>
                  )}

                  {parentTopic && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Roadmap Step</span>
                      <button
                        onClick={() => onSelectTopic(parentTopic.id)}
                        className="text-cyan-400 hover:text-cyan-300 font-mono font-bold truncate max-w-[160px]"
                      >
                        Step {parentTopic.stepNumber}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Resource Type</span>
                    <span className="text-slate-200 font-mono uppercase font-bold text-[11px]">
                      {resource.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Supabase Live Sync</span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </div>
                </div>

                {/* Secondary Actions */}
                <div className="pt-2 flex items-center gap-2">
                  {onToggleSave && (
                    <button
                      onClick={() => onToggleSave(resource.id)}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isSaved
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400' : ''}`} />
                      <span>{isSaved ? 'Saved' : 'Bookmark'}</span>
                    </button>
                  )}

                  <button
                    onClick={handleCopyLink}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{copiedLink ? 'Copied' : 'Share'}</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: Related Resources in this Topic */}
        {relatedResources.length > 0 && (
          <div className="mt-16 pt-12 border-t border-slate-800/80 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  More Resources in Step {parentTopic?.stepNumber}: {parentTopic?.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Continue advancing through the curated curriculum roadmap.
                </p>
              </div>

              {parentTopic && (
                <button
                  onClick={() => onSelectTopic(parentTopic.id)}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <span>View All in Topic</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedResources.map((relRes) => (
                <div
                  key={relRes.id}
                  onClick={() => onSelectResource(relRes)}
                  className="cursor-pointer group p-4 rounded-2xl bg-[#0D1117]/95 border border-slate-800 hover:border-amber-400/50 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        {relRes.type}
                      </span>
                      {relRes.difficulty && (
                        <span className="text-[9px] font-mono text-slate-400">
                          {relRes.difficulty}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-2">
                      {relRes.title}
                    </h4>

                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {relRes.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-amber-400 font-bold">
                    <span>Explore</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
