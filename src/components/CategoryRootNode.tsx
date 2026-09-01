import React, { useState } from 'react';
import { 
  Tv, 
  Github, 
  GraduationCap, 
  Code2, 
  Globe, 
  FileText, 
  BookOpen, 
  Newspaper, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  Star,
  Bookmark,
  Edit3,
  Trash2
} from 'lucide-react';
import { ResourceItem, ResourceType } from '../types';

interface CategoryRootNodeProps {
  type: ResourceType;
  resources: ResourceItem[];
  savedResources: Record<string, boolean>;
  onToggleSave: (id: string) => void;
  onOpenResourceDetails?: (resource: ResourceItem) => void;
  onEdit?: (resource: ResourceItem) => void;
  onDelete?: (resource: ResourceItem) => void;
}

export const CategoryRootNode: React.FC<CategoryRootNodeProps> = ({
  type,
  resources,
  savedResources,
  onToggleSave,
  onOpenResourceDetails,
  onEdit,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (resources.length === 0) return null;

  const getCategoryConfig = (t: ResourceType) => {
    switch (t) {
      case 'youtube':
        return {
          icon: <Tv className="w-4 h-4 text-red-400" />,
          title: 'YouTube Videos & Playlists',
          tag: 'Playlists & Masterclasses',
          borderColor: 'border-red-500/40 hover:border-red-400',
          bgColor: 'bg-red-950/20',
          textColor: 'text-red-300',
          badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40'
        };
      case 'github':
        return {
          icon: <Github className="w-4 h-4 text-emerald-400" />,
          title: 'GitHub Repositories',
          tag: 'Code & Frameworks',
          borderColor: 'border-emerald-500/40 hover:border-emerald-400',
          bgColor: 'bg-emerald-950/20',
          textColor: 'text-emerald-300',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        };
      case 'course':
        return {
          icon: <GraduationCap className="w-4 h-4 text-purple-400" />,
          title: 'Curated Courses',
          tag: 'Structured Paths',
          borderColor: 'border-purple-500/40 hover:border-purple-400',
          bgColor: 'bg-purple-950/20',
          textColor: 'text-purple-300',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
        };
      case 'project':
        return {
          icon: <Code2 className="w-4 h-4 text-amber-400" />,
          title: 'Practical Projects',
          tag: 'Hands-on Code',
          borderColor: 'border-amber-500/40 hover:border-amber-400',
          bgColor: 'bg-amber-950/20',
          textColor: 'text-amber-300',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        };
      case 'documentation':
        return {
          icon: <Globe className="w-4 h-4 text-blue-400" />,
          title: 'Official Docs & Sandboxes',
          tag: 'Core References',
          borderColor: 'border-blue-500/40 hover:border-blue-400',
          bgColor: 'bg-blue-950/20',
          textColor: 'text-blue-300',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
        };
      case 'paper':
        return {
          icon: <FileText className="w-4 h-4 text-teal-400" />,
          title: 'Seminal Research Papers',
          tag: 'Foundational Theory',
          borderColor: 'border-teal-500/40 hover:border-teal-400',
          bgColor: 'bg-teal-950/20',
          textColor: 'text-teal-300',
          badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/40'
        };
      case 'book':
        return {
          icon: <BookOpen className="w-4 h-4 text-rose-400" />,
          title: 'Essential Books',
          tag: 'Comprehensive Texts',
          borderColor: 'border-rose-500/40 hover:border-rose-500',
          bgColor: 'bg-rose-950/20',
          textColor: 'text-rose-300',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        };
      case 'article':
        return {
          icon: <Newspaper className="w-4 h-4 text-cyan-400" />,
          title: 'Articles & System Deep-Dives',
          tag: 'Engineering Guides',
          borderColor: 'border-cyan-500/40 hover:border-cyan-400',
          bgColor: 'bg-cyan-950/20',
          textColor: 'text-cyan-300',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
        };
      default:
        return {
          icon: <Globe className="w-4 h-4 text-slate-400" />,
          title: 'Resources',
          tag: 'Reference',
          borderColor: 'border-slate-700',
          bgColor: 'bg-slate-900',
          textColor: 'text-slate-300',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-700'
        };
    }
  };

  const config = getCategoryConfig(type);

  return (
    <div className="w-[300px] sm:w-[320px] flex flex-col transition-all duration-200">
      {/* Root Node Header Header Pill */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-3 rounded-2xl bg-[#0D1117]/95 border ${config.borderColor} shadow-lg backdrop-blur-md cursor-pointer transition-all duration-200 hover:shadow-xl flex items-center justify-between gap-2 select-none`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
            {config.icon}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-100 truncate">
              {config.title}
            </h4>
            <span className="text-[10px] text-slate-400 block font-mono">
              {config.tag}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${config.badgeBg} border`}>
            {resources.length}
          </span>
          <button className="text-slate-500 hover:text-slate-200">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Branching Leaf Nodes */}
      {isExpanded && (
        <div className="mt-2.5 pl-3 border-l-2 border-slate-800 space-y-2.5 relative max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
          {resources.map((res) => {
            const isSaved = !!savedResources[res.id];

            return (
              <div
                key={res.id}
                onClick={() => onOpenResourceDetails && onOpenResourceDetails(res)}
                className="group relative p-3 rounded-xl bg-[#090A0F]/90 border border-slate-800 hover:border-slate-600 hover:bg-slate-900 transition-all shadow-md cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-1 block"
                    >
                      {res.title}
                    </a>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {res.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onToggleSave && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSave(res.id);
                        }}
                        className={`p-1 rounded-md transition-colors ${
                          isSaved
                            ? 'text-amber-400 bg-amber-400/10'
                            : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                        title={isSaved ? 'Remove from collection' : 'Save to collection'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400' : ''}`} />
                      </button>
                    )}

                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(res);
                        }}
                        className="p-1 rounded-md text-slate-500 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                        title="Edit resource"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(res);
                        }}
                        className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                      title="Open external resource"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Micro metadata */}
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/60">
                  <span className="text-slate-400 truncate max-w-[150px]">
                    {res.channelName || res.author || res.instructor || res.siteName || res.authors || 'Curated'}
                  </span>

                  {res.stars && (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-emerald-400" />
                      <span>{res.stars}</span>
                    </span>
                  )}
                  {res.duration && (
                    <span className="text-slate-400">
                      {res.duration}
                    </span>
                  )}
                  {res.rating && (
                    <span className="text-amber-400 font-bold">
                      ★ {res.rating}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
