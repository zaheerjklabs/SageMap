import React from 'react';
import { Github, Star, GitFork, FolderGit2 } from 'lucide-react';
import { ResourceItem } from '../types';

interface GitHubCardBannerProps {
  resource: ResourceItem;
  className?: string;
}

export function parseGitHubOwnerAndRepo(url: string, title?: string, author?: string): { owner: string; repo: string } {
  if (url) {
    const clean = url
      .replace(/https?:\/\/(www\.)?github\.com\//i, '')
      .replace(/\.git$/i, '')
      .split('/tree/')[0]
      .split('/blob/')[0]
      .split('#')[0]
      .split('?')[0]
      .trim();

    const parts = clean.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    } else if (parts.length === 1) {
      return { owner: author || parts[0], repo: title || parts[0] };
    }
  }

  // Fallback from title
  if (title && title.includes('/')) {
    const parts = title.split('/').map((s) => s.trim());
    return { owner: parts[0], repo: parts[1] };
  }

  return { owner: author || 'GitHub', repo: title || 'Repository' };
}

export const GitHubCardBanner: React.FC<GitHubCardBannerProps> = ({
  resource,
  className = 'w-full h-full'
}) => {
  const { owner, repo } = parseGitHubOwnerAndRepo(resource.url, resource.title, resource.author);

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900 p-5 flex flex-col justify-between overflow-hidden select-none font-sans border-b border-slate-200 shadow-inner ${className}`}
      style={{ minHeight: '160px' }}
    >
      {/* Top Header with GitHub Brand Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 text-white text-[10px] font-mono font-bold tracking-wider uppercase shadow-sm">
          <Github className="w-3.5 h-3.5 text-white" />
          <span>GITHUB REPOSITORY</span>
        </div>

        <FolderGit2 className="w-4 h-4 text-slate-400" />
      </div>

      {/* Main Center Area: Full Name of Owner & Full Repo Name */}
      <div className="my-auto py-2">
        <div className="text-xs sm:text-sm font-semibold text-slate-500 truncate tracking-wide">
          {owner}
        </div>
        <div className="text-base sm:text-xl font-black text-slate-950 leading-tight break-words line-clamp-2 mt-0.5 tracking-tight font-heading">
          {repo}
        </div>
      </div>

      {/* Bottom stats row */}
      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600 font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
            <span>{resource.stars || 'Stars'}</span>
          </div>

          {resource.forks && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <GitFork className="w-3.5 h-3.5" />
              <span>{resource.forks}</span>
            </div>
          )}
        </div>

        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          Open Source
        </span>
      </div>
    </div>
  );
};

