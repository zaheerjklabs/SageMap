import React, { useState } from 'react';
import { Star, PlayCircle } from 'lucide-react';
import { UdemyLogo } from './UdemyLogo';
import { ResourceItem } from '../types';

interface UdemyCourseBannerProps {
  resource: ResourceItem;
  className?: string;
}

export function getUdemyThumbnailUrl(url?: string, existingImageUrl?: string): string {
  if (existingImageUrl && existingImageUrl.trim()) {
    return existingImageUrl.trim();
  }
  if (url && url.trim()) {
    const cleanUrl = url.trim().split('?')[0];
    return `https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}&embed=image.url`;
  }
  return '';
}

export const UdemyCourseBanner: React.FC<UdemyCourseBannerProps> = ({
  resource,
  className = 'w-full h-full'
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const thumbUrl = getUdemyThumbnailUrl(resource.url, resource.imageUrl || resource.thumbnailUrl);

  // If thumbnail is available and hasn't failed, render it with the Udemy badge
  if (thumbUrl && !imgFailed) {
    return (
      <div className={`relative w-full h-full bg-[#1C1D1F] overflow-hidden group ${className}`}>
        <img
          src={thumbUrl}
          alt={resource.title}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-[#1C1D1F]/90 backdrop-blur-md border border-purple-500/40 text-purple-300 text-[10px] font-extrabold flex items-center gap-1.5 shadow-lg">
          <UdemyLogo className="w-3.5 h-3.5 text-purple-400" />
          <span>UDEMY</span>
        </div>
      </div>
    );
  }

  // If thumbnail can't be fetched from link, render clean official branded banner (like before)
  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br from-[#1C1D1F] via-[#2D2F31] to-[#1C1D1F] text-white p-5 flex flex-col justify-between overflow-hidden select-none border-b border-purple-500/20 ${className}`}
      style={{ minHeight: '160px' }}
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#A435F0]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-[#5624D0]/20 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 shadow-md">
          <UdemyLogo className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-black tracking-widest uppercase">UDEMY COURSE</span>
        </div>

        {resource.rating && (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold font-mono">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{resource.rating}★</span>
          </div>
        )}
      </div>

      {/* Center: Course Title */}
      <div className="my-2 z-10">
        <h4 className="text-sm sm:text-base font-extrabold text-white leading-snug line-clamp-2 drop-shadow-sm group-hover:text-purple-300 transition-colors">
          {resource.title}
        </h4>
        <p className="text-xs text-slate-400 mt-1 font-medium truncate">
          {resource.instructor ? `Instructor: ${resource.instructor}` : 'Comprehensive Online Course'}
        </p>
      </div>

      {/* Bottom Footer */}
      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 z-10">
        <span className="font-mono text-purple-300 font-bold">
          {resource.duration || 'Full Lifetime Access'}
        </span>

        <div className="flex items-center gap-1 text-slate-300 font-bold">
          <PlayCircle className="w-3.5 h-3.5 text-purple-400" />
          <span>Watch Course</span>
        </div>
      </div>
    </div>
  );
};


