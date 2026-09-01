import React from 'react';
import { Tv, ListVideo, PlayCircle, Play, Sparkles } from 'lucide-react';
import { ResourceItem } from '../types';
import { parseYouTubeUrl } from '../utils/youtubeUtils';

interface YouTubeCardBannerProps {
  resource: ResourceItem;
  className?: string;
}

export const YouTubeCardBanner: React.FC<YouTubeCardBannerProps> = ({
  resource,
  className = 'w-full h-full'
}) => {
  const parsed = parseYouTubeUrl(resource.url);
  const isPlaylist = resource.videoType === 'Playlist' || parsed.isPlaylist;

  const channel = resource.channelName || resource.author || 'YouTube Masterclass';
  const durationText = resource.duration || (isPlaylist ? (resource.videoCount ? `${resource.videoCount} Lessons` : 'Full Playlist Series') : 'Video Course');

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br from-[#120406] via-[#1a080c] to-[#0d0305] text-white p-5 flex flex-col justify-between overflow-hidden select-none border-b border-red-500/20 group font-sans ${className}`}
      style={{ minHeight: '160px' }}
    >
      {/* Background ambient red glow */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-red-600/15 blur-3xl pointer-events-none group-hover:bg-red-600/25 transition-all duration-500" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-950/90 border border-red-500/50 text-red-300 shadow-md backdrop-blur-md">
          {isPlaylist ? (
            <ListVideo className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <Tv className="w-3.5 h-3.5 text-red-400" />
          )}
          <span className="text-[10px] font-black tracking-widest uppercase">
            {isPlaylist ? 'YOUTUBE PLAYLIST' : (resource.videoType ? `YOUTUBE ${resource.videoType.toUpperCase()}` : 'YOUTUBE MASTERCLASS')}
          </span>
        </div>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] font-mono font-bold">
          <Sparkles className="w-3 h-3 text-red-400" />
          <span>{isPlaylist ? 'Series' : 'HD 4K'}</span>
        </div>
      </div>

      {/* Center: Channel & Title */}
      <div className="my-2 z-10">
        <div className="text-xs font-semibold text-red-300/80 truncate tracking-wide flex items-center gap-1.5">
          <span>{channel}</span>
        </div>
        <h4 className="text-sm sm:text-base font-extrabold text-white leading-snug line-clamp-2 drop-shadow-sm group-hover:text-red-200 transition-colors mt-0.5 font-heading">
          {resource.title}
        </h4>
      </div>

      {/* Bottom Footer */}
      <div className="pt-2 border-t border-red-950/80 flex items-center justify-between text-[11px] text-slate-300 z-10 font-mono">
        <span className="text-red-300 font-bold flex items-center gap-1">
          {isPlaylist && <ListVideo className="w-3 h-3 text-red-400" />}
          {durationText}
        </span>

        <div className="flex items-center gap-1 text-slate-300 font-bold group-hover:text-white transition-colors">
          <PlayCircle className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] tracking-wider uppercase font-extrabold">
            {isPlaylist ? 'Watch Playlist' : 'Watch Video'}
          </span>
        </div>
      </div>
    </div>
  );
};
