import React, { useState } from 'react';
import { 
  X, 
  Tv, 
  Github, 
  GraduationCap, 
  Code2, 
  Globe, 
  FileText, 
  BookOpen, 
  Newspaper, 
  HelpCircle, 
  Wrench, 
  Search, 
  ExternalLink, 
  Sparkles, 
  Bookmark, 
  ChevronRight, 
  ListOrdered, 
  Layers, 
  Plus, 
  Share2,
  FileCode2,
  Edit3,
  Bot,
  Brain
} from 'lucide-react';
import { RoadmapTopic, ResourceType, ResourceItem } from '../types';
import { ResourceCard } from './ResourceCard';
import { UdemyLogo } from './UdemyLogo';

interface TopicDashboardProps {
  topic: RoadmapTopic | null;
  isOpen: boolean;
  onClose: () => void;
  savedResources: Record<string, boolean>;
  onToggleSave: (resourceId: string) => void;
  onEditResource?: (resource: ResourceItem) => void;
  onDeleteResource?: (resource: ResourceItem) => void;
  topicNote: string;
  onSaveNote: (topicId: number, note: string) => void;
  onSelectTopic: (topicId: number) => void;
  onAddCustomResourceClick?: (topicId: number) => void;
  onOpenSageAi?: (topicId: number) => void;
  onOpenQuiz?: (topicId: number) => void;
}

type TabType = 'all' | 'youtube' | 'github' | 'course' | 'project' | 'documentation' | 'paper' | 'book' | 'article' | 'interview' | 'tools';

export const TopicDashboard: React.FC<TopicDashboardProps> = ({
  topic,
  isOpen,
  onClose,
  savedResources,
  onToggleSave,
  onEditResource,
  onDeleteResource,
  topicNote,
  onSaveNote,
  onSelectTopic,
  onAddCustomResourceClick,
  onOpenSageAi,
  onOpenQuiz
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [noteText, setNoteText] = useState(topicNote || '');
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Keep local note text in sync with props
  React.useEffect(() => {
    setNoteText(topicNote || '');
  }, [topicNote, topic?.id]);

  if (!isOpen || !topic) return null;

  // Filter resources based on active tab and search query
  const filteredResources = topic.resources.filter((res) => {
    if (activeTab !== 'all' && res.type !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        res.title.toLowerCase().includes(q) ||
        res.description.toLowerCase().includes(q) ||
        res.technologies?.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSaveNoteAction = () => {
    onSaveNote(topic.id, noteText);
    setIsEditingNote(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-md transition-all duration-300 animate-fadeIn">
      {/* Click backdrop to close */}
      <div className="flex-1 hidden md:block" onClick={onClose} />

      {/* Main Drawer / Modal Panel */}
      <div className="w-full md:w-[860px] lg:w-[940px] h-full bg-[#0D1117] border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* ======================================================== */}
        {/* TOP HEADER */}
        {/* ======================================================== */}
        <div className="p-6 border-b border-slate-800 bg-[#090A0F]/90 shrink-0 sticky top-0 z-20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="px-3 py-0.5 rounded-xl text-xs font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  STEP {topic.stepNumber}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {topic.categoryLabel}
                </span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                {topic.title}
              </h2>
              <p className="text-xs lg:text-sm text-slate-300 mt-2 leading-relaxed max-w-3xl">
                {topic.overview}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onOpenSageAi && (
                <button
                  onClick={() => onOpenSageAi(topic.id)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-500/40 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition-all shadow-md"
                  title="Ask SageAI Tutor about this step"
                >
                  <Bot className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline font-black">SageAI</span>
                </button>
              )}

              {onOpenQuiz && (
                <button
                  onClick={() => onOpenQuiz(topic.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-indigo-500/40 text-xs font-bold text-indigo-300 flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Take Quiz & Flashcards for this step"
                >
                  <Brain className="w-4 h-4 text-indigo-400" />
                  <span className="hidden sm:inline">Quiz</span>
                </button>
              )}

              {onAddCustomResourceClick && (
                <button
                  onClick={() => onAddCustomResourceClick(topic.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Add community or custom resource"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span className="hidden sm:inline">Add Resource</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Close dashboard"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SCROLLABLE KNOWLEDGE HUB CONTENT */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Recommended Learning Path Order */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 shadow-lg">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 mb-3">
              <ListOrdered className="w-4 h-4 text-amber-400" />
              <span>Recommended Learning Order</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {topic.recommendedOrder.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 font-medium flex items-center gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-amber-500/30">
                    {idx + 1}
                  </span>
                  <span>{step.replace(/^\d+\.\s*/, '')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Core Concepts Grid */}
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>What to Learn & Core Concepts ({topic.coreConcepts.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topic.coreConcepts.map((concept, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#090A0F]/80 border border-slate-800 hover:border-slate-700 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h4 className="text-xs font-bold text-slate-100">{concept.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {concept.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {concept.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Subtopics Breakdown */}
          {topic.subtopics && topic.subtopics.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 mb-3">
                <FileCode2 className="w-4 h-4 text-purple-400" />
                <span>Curriculum Subtopics ({topic.subtopics.length})</span>
              </h3>
              <div className="space-y-2.5">
                {topic.subtopics.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{sub.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{sub.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      {sub.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* RESOURCE ROADMAP & DISCOVERY HUB */}
          {/* ======================================================== */}
          <div className="pt-4 border-t border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Curated Learning Resources ({topic.resources.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  High-quality repositories, videos, courses, papers, books, and articles.
                </p>
              </div>

              {/* Resource search inside topic */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>All ({topic.resources.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('youtube')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'youtube'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-red-300 border border-slate-800'
                }`}
              >
                <Tv className="w-3.5 h-3.5 text-red-400" />
                <span>YouTube</span>
              </button>

              <button
                onClick={() => setActiveTab('github')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'github'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-emerald-300 border border-slate-800'
                }`}
              >
                <Github className="w-3.5 h-3.5 text-emerald-400" />
                <span>GitHub</span>
              </button>

              <button
                onClick={() => setActiveTab('course')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'course'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-purple-300 border border-slate-800'
                }`}
              >
                <UdemyLogo className="w-3.5 h-3.5 text-purple-400" />
                <span>Udemy Courses</span>
              </button>

              <button
                onClick={() => setActiveTab('project')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'project'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-amber-300 border border-slate-800'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Projects</span>
              </button>

              <button
                onClick={() => setActiveTab('documentation')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'documentation'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-blue-300 border border-slate-800'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Docs</span>
              </button>

              <button
                onClick={() => setActiveTab('paper')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'paper'
                    ? 'bg-teal-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-teal-300 border border-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>Papers</span>
              </button>

              <button
                onClick={() => setActiveTab('book')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'book'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-rose-300 border border-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                <span>Books</span>
              </button>
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredResources.map((res) => (
                <ResourceCard
                  key={res.id}
                  resource={res}
                  isSaved={!!savedResources[res.id]}
                  onToggleSave={onToggleSave}
                  onEdit={onEditResource}
                  onDelete={onDeleteResource}
                />
              ))}
            </div>

            {filteredResources.length === 0 && (
              <div className="p-8 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-center">
                <p className="text-xs text-slate-400">
                  No resources found matching the selected filter.
                </p>
              </div>
            )}
          </div>

          {/* Interview Questions Section */}
          {topic.interviewQuestions && topic.interviewQuestions.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Technical Interview Questions & Systems Design</span>
              </h3>
              <div className="space-y-3">
                {topic.interviewQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-xs font-bold text-slate-100">{q.question}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 shrink-0">
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {q.answerSummary}
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-cyan-300 font-mono">
                      💡 Key takeaway: {q.keyTakeaway}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Useful Tools & Frameworks */}
          {topic.toolsAndFrameworks && topic.toolsAndFrameworks.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-400" />
                <span>Industry Frameworks & Developer Tools</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topic.toolsAndFrameworks.map((tool, idx) => (
                  <a
                    key={idx}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-400/60 hover:bg-slate-850 transition-colors block group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                        {tool.name}
                      </h4>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-purple-400" />
                    </div>
                    <span className="text-[10px] text-purple-400 font-mono block mt-0.5">
                      {tool.category}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {tool.description}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Study & Exploration Notes */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Personal Exploration Notes</span>
              </h3>

              {!isEditingNote ? (
                <button
                  onClick={() => setIsEditingNote(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Note</span>
                </button>
              ) : (
                <button
                  onClick={handleSaveNoteAction}
                  className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
                >
                  Save Note
                </button>
              )}
            </div>

            {isEditingNote ? (
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your research notes, key paper citations, architectural thoughts, or links here..."
                rows={4}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 custom-scrollbar font-sans"
              />
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed min-h-[60px]">
                {noteText || 'No notes written yet. Click "Edit Note" to jot down your learning insights.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
