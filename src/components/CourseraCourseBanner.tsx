import React, { useState } from 'react';
import { ResourceItem } from '../types';
import { CourseraLogo } from './CourseraLogo';
import { Award, GraduationCap, CheckCircle2 } from 'lucide-react';

interface CourseraCourseBannerProps {
  resource: ResourceItem;
}

export function getCourseraThumbnailUrl(url?: string, existingImageUrl?: string): string {
  if (existingImageUrl && existingImageUrl.startsWith('http')) {
    return existingImageUrl;
  }
  return '';
}

export const CourseraCourseBanner: React.FC<CourseraCourseBannerProps> = ({
  resource
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const thumbUrl = getCourseraThumbnailUrl(resource.url, resource.imageUrl || resource.thumbnailUrl);

  // If thumbnail is available and hasn't failed, render it with the Coursera badge
  if (thumbUrl && !imgFailed) {
    return (
      <div className="relative w-full h-44 sm:h-48 overflow-hidden rounded-2xl bg-slate-900 group">
        <img
          src={thumbUrl}
          alt={resource.title}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/40" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0056D2]/90 backdrop-blur-md text-white text-[11px] font-black tracking-wider uppercase border border-blue-400/40 shadow-md">
          <CourseraLogo className="w-3.5 h-3.5 text-white" />
          <span>COURSERA</span>
        </div>
      </div>
    );
  }

  // Extract clean course name from URL if possible
  const urlSlug = resource.url
    ? resource.url.split('/learn/')[1]?.split('/')[0]?.split('?')[0]?.replace(/-/g, ' ') ||
      resource.url.split('/specializations/')[1]?.split('/')[0]?.split('?')[0]?.replace(/-/g, ' ') ||
      resource.url.split('/professional-certificates/')[1]?.split('/')[0]?.split('?')[0]?.replace(/-/g, ' ')
    : '';

  const partnerOrInstructor = resource.instructor || resource.author || 'Coursera Partner';

  return (
    <div className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-[#001E62] via-[#003699] to-[#0056D2] p-4 sm:p-5 flex flex-col justify-between text-white border border-blue-500/30 shadow-lg group select-none">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Top Bar: Official Coursera Pill & Level */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-sm">
          <CourseraLogo className="w-4 h-4 text-white" />
          <span className="text-xs font-black tracking-wider uppercase">COURSERA</span>
        </div>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-900/60 border border-blue-400/30 text-[10px] font-bold text-blue-200 uppercase tracking-wide">
          <Award className="w-3 h-3 text-blue-300" />
          <span>Certificate</span>
        </div>
      </div>

      {/* Middle: Course Title / Topic Focus */}
      <div className="relative z-10 my-auto">
        <h4 className="text-sm sm:text-base font-black text-white line-clamp-2 leading-snug tracking-tight drop-shadow">
          {resource.title}
        </h4>
        {urlSlug && urlSlug.toLowerCase() !== resource.title.toLowerCase() && (
          <p className="text-[11px] text-blue-200/90 font-medium capitalize mt-1 truncate">
            {urlSlug}
          </p>
        )}
      </div>

      {/* Bottom: Partner / Instructor & University Badge */}
      <div className="relative z-10 pt-2 border-t border-white/15 flex items-center justify-between text-xs text-blue-100">
        <div className="flex items-center gap-1.5 truncate max-w-[70%]">
          <GraduationCap className="w-3.5 h-3.5 text-blue-200 shrink-0" />
          <span className="truncate font-semibold text-[11px]">
            {partnerOrInstructor}
          </span>
        </div>

        <span className="flex items-center gap-1 text-[10px] font-mono text-blue-200 shrink-0">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Verified</span>
        </span>
      </div>
    </div>
  );
};
