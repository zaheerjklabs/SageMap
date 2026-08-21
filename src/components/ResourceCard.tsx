import React from 'react';
import { 
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
  Code2
} from 'lucide-react';
import { UdemyLogo } from './UdemyLogo';
import { ResourceItem, ResourceType } from '../types';

interface ResourceCardProps {
  resource: ResourceItem;
  isSaved?: boolean;
  onToggleSave?: (resourceId: string) => void;
  onEdit?: (resource: ResourceItem) => void;
  onDelete?: (resource: ResourceItem) => void;
  compact?: boolean;
}

export const GITHUB_LOGO_THUMBNAIL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="100%" height="100%">
  <defs>
    <linearGradient id="gh-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A1128"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
  </defs>
  <rect width="400" height="225" fill="url(#gh-bg)"/>
  <circle cx="200" cy="112.5" r="56" fill="#ffffff"/>
  <g transform="translate(149.6, 62.1) scale(4.2)">
    <path fill="#040814" fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </g>
</svg>
`)}`;

export const getResourceThumbnail = (resource: ResourceItem): string => {
  const url = resource.url || '';
  const isGithub = resource.type === 'github' || url.toLowerCase().includes('github.com');

  // For ALL GitHub resources, strictly return the GitHub logo thumbnail
  if (isGithub) {
    return GITHUB_LOGO_THUMBNAIL;
  }

  if (resource.imageUrl) return resource.imageUrl;
  if (resource.thumbnailUrl) return resource.thumbnailUrl;

  // 1. YouTube Thumbnail Extraction (HQ standard thumbnail)
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }

  // 2. Udemy Course Thumbnail Extraction via OpenGraph API
  if (url.includes('udemy.com')) {
    return `https://api.microlink.io/?url=${encodeURIComponent(url)}&embed=image.url`;
  }

  // 3. High Quality Domain & Topic Based Unsplash Cover Imagery
  const lowerUrl = url.toLowerCase();
  const lowerTitle = resource.title.toLowerCase();

  if (lowerUrl.includes('fast.ai') || lowerTitle.includes('fast.ai')) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop';
  }
  if (lowerUrl.includes('coursera') || lowerUrl.includes('deeplearning.ai') || lowerTitle.includes('andrew ng')) {
    return 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop';
  }
  if (lowerTitle.includes('math') || lowerTitle.includes('linear algebra') || lowerTitle.includes('calculus')) {
    return 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop';
  }
  if (lowerTitle.includes('transformer') || lowerTitle.includes('llm') || lowerTitle.includes('gpt') || lowerTitle.includes('agent')) {
    return 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=800&auto=format&fit=crop';
  }
  if (lowerTitle.includes('python') || lowerTitle.includes('pytorch') || lowerTitle.includes('code')) {
    return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop';
  }
  if (lowerTitle.includes('vision') || lowerTitle.includes('cnn') || lowerTitle.includes('opencv')) {
    return 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?q=80&w=800&auto=format&fit=crop';
  }

  return 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop';
};

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
          label: resource.videoType || 'YouTube Video',
          border: 'border-red-500/40',
          bg: 'bg-red-950/80 text-red-300',
          glow: 'group-hover:border-red-500/60'
        };
      case 'github':
        return {
          icon: <Github className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
          label: 'GitHub Repository',
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-950/80 text-emerald-300',
          glow: 'group-hover:border-emerald-500/60'
        };
      case 'course':
        return {
          icon: <UdemyLogo className="w-3.5 h-3.5 text-purple-400 shrink-0" />,
          label: resource.platform || 'Online Course',
          border: 'border-purple-500/40',
          bg: 'bg-purple-950/80 text-purple-300',
          glow: 'group-hover:border-purple-500/60'
        };
      case 'project':
        return {
          icon: <Code2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
          label: resource.projectTier ? `${resource.projectTier} Project` : 'Practical Project',
          border: 'border-amber-500/40',
          bg: 'bg-amber-950/80 text-amber-300',
          glow: 'group-hover:border-amber-500/60'
        };
      case 'documentation':
        return {
          icon: <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
          label: resource.docCategory || 'Official Reference',
          border: 'border-blue-500/40',
          bg: 'bg-blue-950/80 text-blue-300',
          glow: 'group-hover:border-blue-500/60'
        };
      case 'paper':
        return {
          icon: <FileText className="w-3.5 h-3.5 text-teal-400 shrink-0" />,
          label: resource.venue ? `${resource.venue} Paper` : 'Research Paper',
          border: 'border-teal-500/40',
          bg: 'bg-teal-950/80 text-teal-300',
          glow: 'group-hover:border-teal-500/60'
        };
      case 'book':
        return {
          icon: <BookOpen className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
          label: 'Textbook / Book',
          border: 'border-rose-500/40',
          bg: 'bg-rose-950/80 text-rose-300',
          glow: 'group-hover:border-rose-500/60'
        };
      case 'article':
        return {
          icon: <Newspaper className="w-3.5 h-3.5 text-cyan-400 shrink-0" />,
          label: resource.publication || 'Article',
          border: 'border-cyan-500/40',
          bg: 'bg-cyan-950/80 text-cyan-300',
          glow: 'group-hover:border-cyan-500/60'
        };
      default:
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
          label: 'Resource',
          border: 'border-slate-700',
          bg: 'bg-slate-900 text-slate-300',
          glow: 'group-hover:border-slate-500'
        };
    }
  };

  const badge = getTypeBadge(resource.type);
  const thumbnailUrl = getResourceThumbnail(resource);

  return (
    <div
      className={`group relative rounded-2xl bg-[#0D1117]/95 border ${badge.border} ${badge.glow} transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between backdrop-blur-md overflow-hidden ${
        compact ? 'p-0' : 'p-0'
      }`}
    >
      {/* Top Header Badge Row (No overlapping image text!) */}
      <div className="px-3.5 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${badge.bg} border ${badge.border}`}>
            {badge.icon}
            <span className="truncate max-w-[140px]">{badge.label}</span>
          </span>

          {resource.isCustom && (
            <span className="px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
              Custom
            </span>
          )}

          {resource.isEdited && !resource.isCustom && (
            <span className="px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
              Edited
            </span>
          )}
        </div>

        {resource.difficulty && (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900 text-amber-300 border border-slate-700/80">
            {resource.difficulty}
          </span>
        )}
      </div>

      {/* 100% Completely Visible Image Banner (Zero Cropping!) */}
      <div className="relative w-full aspect-video bg-[#05070B] border-b border-slate-800/80 flex items-center justify-center overflow-hidden">
        <img
          src={thumbnailUrl}
          alt={resource.title}
          onError={(e) => {
            if (resource.type === 'github' || (resource.url && resource.url.toLowerCase().includes('github.com'))) {
              (e.target as HTMLImageElement).src = GITHUB_LOGO_THUMBNAIL;
            } else {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop';
            }
          }}
          className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-300 ease-out"
        />
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Action Buttons (Save, Edit, Delete) */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-[11px] font-mono text-slate-400 font-bold truncate">
              {resource.channelName || resource.author || resource.instructor || resource.bookAuthor || resource.siteName || 'Learning Resource'}
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
            </div>
          </div>

          {/* Title */}
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-extrabold text-slate-100 group-hover:text-amber-300 transition-colors leading-snug line-clamp-2 block"
          >
            {resource.title}
          </a>

          {/* Description */}
          <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-2">
            {resource.description}
          </p>

          {/* Dynamic Specific Metadata */}
          <div className="mt-3 flex items-center flex-wrap gap-2 text-[11px] text-slate-400 font-mono">
            {resource.duration && (
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{resource.duration}</span>
              </span>
            )}

            {resource.stars && (
              <span className="flex items-center gap-1 text-emerald-300 font-bold">
                <Star className="w-3 h-3 text-emerald-400 fill-emerald-400/40" />
                <span>{resource.stars} stars</span>
              </span>
            )}

            {resource.rating && (
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>{resource.rating}★</span>
              </span>
            )}

            {resource.authors && (
              <span className="text-teal-300 truncate max-w-[200px]">
                {resource.authors} {resource.year && `(${resource.year})`}
              </span>
            )}
          </div>
        </div>

        {/* Card Action Footer (View Details ↗ Button matching Krish Naik website layout!) */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
            {resource.type}
          </span>

          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/60 text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-all shadow-sm"
          >
            <span>View Details</span>
            <ExternalLink className="w-3 h-3 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
};
