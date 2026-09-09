import React from 'react';
import { FileText, GraduationCap, Sparkles, BookMarked, DownloadCloud, ExternalLink } from 'lucide-react';
import { ResourceItem } from '../types';

interface PaperCardBannerProps {
  resource: ResourceItem;
  className?: string;
}

export function parsePaperDetails(url?: string, rawAuthors?: string, rawYear?: string | number, venue?: string): {
  arxivId: string | null;
  venueDisplay: string;
  authorsDisplay: string;
  yearDisplay: string;
  isArxiv: boolean;
} {
  const cleanUrl = url || '';
  
  // Extract arXiv ID if present (e.g. 1706.03762 or 2303.08774)
  const arxivMatch = cleanUrl.match(/arxiv\.org\/(?:abs|pdf)\/([0-9]+\.[0-9]+(?:v[0-9]+)?|[a-zA-Z-]+\/[0-9]+)/i);
  const arxivId = arxivMatch ? `arXiv:${arxivMatch[1]}` : null;
  const isArxiv = !!arxivId || cleanUrl.toLowerCase().includes('arxiv');

  // Determine venue display
  let venueDisplay = venue || (isArxiv ? (arxivId || 'arXiv Preprint') : 'Research Paper');
  if (venueDisplay === 'arXiv' && arxivId) {
    venueDisplay = arxivId;
  }

  // Format Authors
  let authorsDisplay = rawAuthors?.trim() || 'Academic Authors & Researchers';
  if (authorsDisplay.length > 55) {
    authorsDisplay = authorsDisplay.slice(0, 52) + '...';
  }

  // Format Year
  let yearDisplay = rawYear ? String(rawYear) : '';
  if (!yearDisplay && arxivId) {
    // Derive approximate year from arxiv ID YYMM
    const match = arxivId.match(/arXiv:([0-9]{2})/);
    if (match) {
      const yy = parseInt(match[1], 10);
      yearDisplay = yy > 50 ? `19${yy}` : `20${yy < 10 ? '0' + yy : yy}`;
    }
  }
  if (!yearDisplay) {
    yearDisplay = 'Peer-Reviewed';
  }

  return {
    arxivId,
    venueDisplay,
    authorsDisplay,
    yearDisplay,
    isArxiv
  };
}

export const PaperCardBanner: React.FC<PaperCardBannerProps> = ({
  resource,
  className = 'w-full h-full'
}) => {
  const { venueDisplay, authorsDisplay, yearDisplay, isArxiv } = parsePaperDetails(
    resource.url,
    resource.authors,
    resource.year,
    resource.venue
  );

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#080D1A] text-slate-100 p-4 sm:p-5 flex flex-col justify-between overflow-hidden select-none font-sans border-b border-slate-800 shadow-inner group ${className}`}
      style={{ minHeight: '160px' }}
    >
      {/* Background Subtle Mathematical LaTeX Formula Watermark */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none font-mono text-[11px] leading-relaxed text-cyan-300 p-3 select-none overflow-hidden"
        style={{
          backgroundImage: `radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.15), transparent 40%),
                            radial-gradient(circle at 10% 90%, rgba(168, 85, 247, 0.15), transparent 40%)`
        }}
      >
        <div className="space-y-1 tracking-wider whitespace-nowrap">
          <div>{'Attention(Q,K,V) = softmax(Q·Kᵀ / √dₖ)·V'}</div>
          <div>{'∇_θ L(θ) = E_{x~p}[ ∇_θ log π_θ(a|s) · Q^π(s,a) ]'}</div>
          <div>{'L_G = E_{x}[log D(x)] + E_{z}[log(1 - D(G(z)))]'}</div>
          <div>{'h_t = σ(W_hh h_{t-1} + W_xh x_t + b_h)'}</div>
          <div>{'KL(q_φ(z|x) || p_θ(z)) ≥ -E_{q}[log p_θ(x|z)]'}</div>
        </div>
      </div>

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Top Header Row with Academic Venue Pill & Manuscript Badge */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* arXiv / Venue Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold tracking-wider uppercase shadow-md ${
            isArxiv 
              ? 'bg-rose-950/90 text-rose-300 border border-rose-500/40 shadow-rose-950/50'
              : 'bg-teal-950/90 text-teal-300 border border-teal-500/40 shadow-teal-950/50'
          }`}>
            <FileText className={`w-3 h-3 ${isArxiv ? 'text-rose-400' : 'text-teal-400'}`} />
            <span className="truncate max-w-[170px]">{venueDisplay}</span>
          </div>

          {resource.difficulty && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-slate-900/90 text-amber-300 border border-slate-750">
              {resource.difficulty}
            </span>
          )}
        </div>

        {/* PDF / Research Document Pill */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-750/80 text-[10px] text-slate-400 font-mono">
          <BookMarked className="w-3 h-3 text-cyan-400" />
          <span className="hidden sm:inline">Manuscript</span>
        </div>
      </div>

      {/* Main Center Area: Academic Paper Title & Authors */}
      <div className="relative z-10 my-auto py-2.5">
        <h4 className="text-sm sm:text-base font-extrabold text-slate-100 group-hover:text-amber-300 transition-colors leading-snug line-clamp-2 tracking-tight font-heading">
          {resource.title}
        </h4>

        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400 font-medium">
          <GraduationCap className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="truncate text-slate-300 font-sans">{authorsDisplay}</span>
        </div>
      </div>

      {/* Bottom Metadata Bar */}
      <div className="relative z-10 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {yearDisplay}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider hidden sm:inline">
            Open Access
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-bold group-hover:underline">
          <span>Read Paper</span>
          <ExternalLink className="w-3 h-3 text-cyan-400" />
        </div>
      </div>
    </div>
  );
};
