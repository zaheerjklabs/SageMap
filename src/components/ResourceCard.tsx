import React from 'react';
import { 
  Tv, 
  Github, 
  GraduationCap, 
  Code2, 
  Globe, 
  FileText, 
  BookOpen, 
  Newspaper, 
  ExternalLink, 
  Star, 
  Bookmark, 
  Clock, 
  Award,
  Sparkles,
  Layers,
  User,
  Edit3,
  Trash2
} from 'lucide-react';
import { ResourceItem, ResourceType } from '../types';

interface ResourceCardProps {
  resource: ResourceItem;
  isSaved?: boolean;
  onToggleSave?: (resourceId: string) => void;
  onEdit?: (resource: ResourceItem) => void;
  onDelete?: (resource: ResourceItem) => void;
  compact?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isSaved = false,
  onToggleSave,
  onEdit,
  onDelete,
  compact = false
}) => {
  const getTypeBadge = (type: ResourceType) => {
    switch (type) {
      case 'youtube':
        return {
          icon: <Tv className="w-3.5 h-3.5 text-red-400 shrink-0" />,
          label: resource.videoType || 'YouTube',
          border: 'border-red-500/30',
          bg: 'bg-red-500/10 text-red-300',
          glow: 'group-hover:border-red-500/60'
        };
      case 'github':
        return {
          icon: <Github className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
          label: 'GitHub Repo',
          border: 'border-emerald-500/30',
          bg: 'bg-emerald-500/10 text-emerald-300',
          glow: 'group-hover:border-emerald-500/60'
        };
      case 'course':
        return {
          icon: <GraduationCap className="w-3.5 h-3.5 text-purple-400 shrink-0" />,
          label: resource.platform || 'Course',
          border: 'border-purple-500/30',
          bg: 'bg-purple-500/10 text-purple-300',
          glow: 'group-hover:border-purple-500/60'
        };
      case 'project':
        return {
          icon: <Code2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
          label: resource.projectTier ? `${resource.projectTier} Project` : 'Practical Project',
          border: 'border-amber-500/30',
          bg: 'bg-amber-500/10 text-amber-300',
          glow: 'group-hover:border-amber-500/60'
        };
      case 'documentation':
        return {
          icon: <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
          label: resource.docCategory || 'Documentation',
          border: 'border-blue-500/30',
          bg: 'bg-blue-500/10 text-blue-300',
          glow: 'group-hover:border-blue-500/60'
        };
      case 'paper':
        return {
          icon: <FileText className="w-3.5 h-3.5 text-teal-400 shrink-0" />,
          label: resource.venue ? `${resource.venue} Paper` : 'Research Paper',
          border: 'border-teal-500/30',
          bg: 'bg-teal-500/10 text-teal-300',
          glow: 'group-hover:border-teal-500/60'
        };
      case 'book':
        return {
          icon: <BookOpen className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
          label: 'Book',
          border: 'border-rose-500/30',
          bg: 'bg-rose-500/10 text-rose-300',
          glow: 'group-hover:border-rose-500/60'
        };
      case 'article':
        return {
          icon: <Newspaper className="w-3.5 h-3.5 text-cyan-400 shrink-0" />,
          label: resource.publication || 'Article',
          border: 'border-cyan-500/30',
          bg: 'bg-cyan-500/10 text-cyan-300',
          glow: 'group-hover:border-cyan-500/60'
        };
      default:
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
          label: 'Resource',
          border: 'border-slate-700',
          bg: 'bg-slate-800 text-slate-300',
          glow: 'group-hover:border-slate-500'
        };
    }
  };

  const badge = getTypeBadge(resource.type);

  return (
    <div
      className={`group relative rounded-2xl bg-[#0D1117]/95 border ${badge.border} ${badge.glow} p-4 transition-all duration-200 hover:shadow-xl hover:translate-y-[-2px] flex flex-col justify-between backdrop-blur-md ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div>
        {/* Header Badges & Actions */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${badge.bg} border ${badge.border}`}>
              {badge.icon}
              <span className="truncate max-w-[120px]">{badge.label}</span>
            </span>

            {resource.isCustom && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Custom
              </span>
            )}

            {resource.isEdited && !resource.isCustom && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Edited
              </span>
            )}

            {resource.difficulty && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
                {resource.difficulty}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onToggleSave && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(resource.id);
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  isSaved
                    ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
                title={isSaved ? 'Remove from saved collection' : 'Save resource to collection'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400' : ''}`} />
              </button>
            )}

            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(resource);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                title="Edit resource details"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(resource);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete this resource"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
              title="Open external resource link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Title */}
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2 block"
        >
          {resource.title}
        </a>

        {/* Description */}
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
          {resource.description}
        </p>

        {/* Dynamic Specific Metadata */}
        <div className="mt-3 flex items-center flex-wrap gap-2 text-[11px] text-slate-400 font-mono">
          {/* YouTube duration & channel */}
          {resource.channelName && (
            <span className="flex items-center gap-1 text-slate-300">
              <User className="w-3 h-3 text-red-400" />
              <span>{resource.channelName}</span>
            </span>
          )}
          {resource.duration && (
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{resource.duration}</span>
            </span>
          )}

          {/* GitHub stars & author */}
          {resource.stars && (
            <span className="flex items-center gap-1 text-emerald-300">
              <Star className="w-3 h-3 text-emerald-400 fill-emerald-400/40" />
              <span>{resource.stars} stars</span>
            </span>
          )}
          {resource.author && (
            <span className="text-slate-400">by {resource.author}</span>
          )}

          {/* Course instructor & rating */}
          {resource.instructor && (
            <span className="text-purple-300 font-sans">
              Instructor: <strong className="text-slate-200">{resource.instructor}</strong>
            </span>
          )}
          {resource.rating && (
            <span className="flex items-center gap-1 text-amber-300 font-bold">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{resource.rating}</span>
            </span>
          )}

          {/* Research Paper author & year */}
          {resource.authors && (
            <span className="text-teal-300 truncate max-w-[200px]">
              {resource.authors} {resource.year && `(${resource.year})`}
            </span>
          )}

          {/* Book author */}
          {resource.bookAuthor && (
            <span className="text-rose-300 truncate max-w-[200px]">
              {resource.bookAuthor} {resource.bookYear && `• ${resource.bookYear}`}
            </span>
          )}
        </div>
      </div>

      {/* Footer Tags */}
      {resource.technologies && resource.technologies.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
          {resource.technologies.slice(0, 3).map((tech, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800"
            >
              #{tech}
            </span>
          ))}
          {resource.technologies.length > 3 && (
            <span className="text-[10px] text-slate-500 font-mono">
              +{resource.technologies.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
};
