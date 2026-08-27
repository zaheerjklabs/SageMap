import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Tv, 
  Github, 
  GraduationCap, 
  Code2, 
  Globe, 
  FileText, 
  BookOpen, 
  Newspaper, 
  Sparkles, 
  Bookmark, 
  Layers, 
  Plus, 
  ExternalLink,
  SlidersHorizontal,
  GripVertical,
  ArrowUpDown
} from 'lucide-react';
import { ROADMAP_TOPICS } from '../data/roadmapData';
import { ResourceItem, ResourceType, DifficultyLevel, RoadmapTopic } from '../types';
import { sortResourcesByOrder } from '../utils/resourceUtils';
import { ResourceCard } from './ResourceCard';
import { UdemyLogo } from './UdemyLogo';

interface ResourceExplorerViewProps {
  topics?: RoadmapTopic[];
  savedResources: Record<string, boolean>;
  onToggleSave: (resourceId: string) => void;
  onSelectTopic: (topicId: number) => void;
  onOpenResourceDetail?: (resource: ResourceItem) => void;
  isAdmin?: boolean;
  resourceOrder?: string[];
  onReorderResources?: (newOrderIds: string[]) => void;
  onAddResourceClick?: () => void;
  onEditResource?: (resource: ResourceItem) => void;
  onDeleteResource?: (resource: ResourceItem) => void;
  defaultType?: string;
  viewTitle?: string;
  viewSubtitle?: string;
}

export const ResourceExplorerView: React.FC<ResourceExplorerViewProps> = ({
  topics = ROADMAP_TOPICS,
  savedResources,
  onToggleSave,
  onSelectTopic,
  onOpenResourceDetail,
  isAdmin = false,
  resourceOrder = [],
  onReorderResources,
  onAddResourceClick,
  onEditResource,
  onDeleteResource,
  defaultType = 'all',
  viewTitle = 'Resource Discovery Catalog',
  viewSubtitle = 'Browse and filter learning resources across the curriculum.'
}) => {
  const [selectedType, setSelectedType] = useState<string>(defaultType);
  const [selectedTopicId, setSelectedTopicId] = useState<number | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [onlySaved, setOnlySaved] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Synchronize defaultType when viewMode changes
  React.useEffect(() => {
    if (defaultType && defaultType !== selectedType) {
      setSelectedType(defaultType);
    }
  }, [defaultType]);

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Collect and sort all resources across all topics according to admin resourceOrder
  const allResources = useMemo(() => {
    const flattened = topics.flatMap(topic => 
      topic.resources.map(res => ({
        ...res,
        topicNumber: topic.stepNumber,
        topicTitle: topic.title,
        topicCategory: topic.categoryLabel
      }))
    );
    return sortResourcesByOrder(flattened, resourceOrder);
  }, [topics, resourceOrder]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return allResources.filter((res) => {
      if (onlySaved && !savedResources[res.id]) return false;
      if (selectedType !== 'all' && res.type !== selectedType) return false;
      if (selectedTopicId !== 'all' && res.topicId !== selectedTopicId) return false;
      if (selectedDifficulty !== 'all' && res.difficulty !== selectedDifficulty) return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          res.title.toLowerCase().includes(q) ||
          res.description.toLowerCase().includes(q) ||
          res.technologies?.some(t => t.toLowerCase().includes(q)) ||
          res.topicTitle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allResources, onlySaved, savedResources, selectedType, selectedTopicId, selectedDifficulty, searchQuery]);

  const savedCount = Object.keys(savedResources).filter(k => savedResources[k]).length;

  // Drag and Drop handlers for Admin positioning
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!isAdmin) return;
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = (e: React.DragEvent, id: string) => {
    if (!isAdmin) return;
    if (dragOverId === id) {
      setDragOverId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (!isAdmin || !onReorderResources) return;
    e.preventDefault();
    const sourceId = draggedId || e.dataTransfer.getData('text/plain');
    setDraggedId(null);
    setDragOverId(null);

    if (!sourceId || sourceId === targetId) return;

    // Get current full master ordering of all resources
    const currentOrder = allResources.map((r) => r.id);
    const fromIndex = currentOrder.indexOf(sourceId);
    const toIndex = currentOrder.indexOf(targetId);

    if (fromIndex === -1 || toIndex === -1) return;

    const newOrder = [...currentOrder];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);

    onReorderResources(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#090A0F] text-slate-100 p-6 custom-scrollbar font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Banner */}
        <div className="p-6 rounded-3xl bg-[#0D1117] border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {viewTitle}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">
                {filteredResources.length} of {allResources.length} Assets
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {viewTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              {viewSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setOnlySaved(!onlySaved)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all border ${
                onlySaved
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${onlySaved ? 'fill-slate-950' : ''}`} />
              <span>Saved Resources ({savedCount})</span>
            </button>

            {isAdmin && onAddResourceClick && (
              <button
                onClick={onAddResourceClick}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Resource</span>
              </button>
            )}
          </div>
        </div>

        {/* Admin Drag and Drop Notice Banner */}
        {isAdmin && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between gap-3 shadow-lg backdrop-blur-md animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
                <GripVertical className="w-4 h-4" />
              </span>
              <div>
                <span className="font-extrabold uppercase tracking-wider text-[11px] text-amber-400 block">Admin Drag & Drop Mode Active</span>
                <span className="text-slate-300 text-xs font-normal">
                  Drag resource cards using the grip handle (⋮⋮) to customize positioning. Custom positions persist to Supabase DB and sync live to all users!
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-amber-400 text-slate-950 font-black shrink-0">
              Live Order Sync
            </span>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-2xl bg-[#0D1117] border border-slate-800 shadow-xl space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full lg:max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search across 100+ resources, repos, authors, or tools (e.g. PyTorch, LoRA)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>

            {/* Dropdown Filters for Topic & Difficulty */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Topic Select */}
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Topics (1 to 10)</option>
                {ROADMAP_TOPICS.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    Step {topic.stepNumber}: {topic.title}
                  </option>
                ))}
              </select>

              {/* Difficulty Select */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Difficulties</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Resource Type Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-800/80 custom-scrollbar">
            {[
              { id: 'all', label: 'All Categories', icon: <Sparkles className="w-3.5 h-3.5" /> },
              { id: 'youtube', label: 'YouTube Videos', icon: <Tv className="w-3.5 h-3.5 text-red-400" /> },
              { id: 'github', label: 'GitHub Repos', icon: <Github className="w-3.5 h-3.5 text-emerald-400" /> },
              { id: 'course', label: 'Udemy Courses', icon: <UdemyLogo className="w-3.5 h-3.5 text-purple-400" /> },
              { id: 'project', label: 'Projects', icon: <Code2 className="w-3.5 h-3.5 text-amber-400" /> },
              { id: 'documentation', label: 'Docs', icon: <Globe className="w-3.5 h-3.5 text-blue-400" /> },
              { id: 'paper', label: 'Research Papers', icon: <FileText className="w-3.5 h-3.5 text-teal-400" /> },
              { id: 'book', label: 'Books', icon: <BookOpen className="w-3.5 h-3.5 text-rose-400" /> },
              { id: 'article', label: 'Articles', icon: <Newspaper className="w-3.5 h-3.5 text-cyan-400" /> }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedType(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedType === cat.id
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((res) => (
            <div
              key={res.id}
              draggable={isAdmin}
              onDragStart={(e) => handleDragStart(e, res.id)}
              onDragOver={(e) => handleDragOver(e, res.id)}
              onDragLeave={(e) => handleDragLeave(e, res.id)}
              onDrop={(e) => handleDrop(e, res.id)}
              onDragEnd={handleDragEnd}
              className="h-full"
            >
              <ResourceCard
                resource={res}
                isSaved={!!savedResources[res.id]}
                onToggleSave={onToggleSave}
                onEdit={onEditResource}
                onDelete={onDeleteResource}
                onOpenDetail={onOpenResourceDetail}
                isAdmin={isAdmin}
                isDragging={draggedId === res.id}
                isDragOver={dragOverId === res.id}
              />
            </div>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="p-12 rounded-3xl bg-[#0D1117] border border-slate-800 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-200">No resources found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search keywords, category filters, or saved resource toggles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
