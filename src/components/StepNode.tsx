import React from 'react';
import { 
  Tv, 
  Github, 
  GraduationCap, 
  Code2, 
  Globe, 
  FileText, 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  HelpCircle, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  FolderTree,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { RoadmapTopic, ResourceItem } from '../types';
import { ResourceCard } from './ResourceCard';
import { UdemyLogo } from './UdemyLogo';
import { CategoryRootNode } from './CategoryRootNode';

interface StepNodeProps {
  topic: RoadmapTopic;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (topicId: number) => void;
  onToggleExpand?: (topicId: number) => void;
  onOpenDashboard: (topicId: number) => void;
  savedResources: Record<string, boolean>;
  onToggleSave: (resourceId: string) => void;
  onEditResource?: (resource: ResourceItem) => void;
  onDeleteResource?: (resource: ResourceItem) => void;
}

export const StepNode: React.FC<StepNodeProps> = ({
  topic,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onOpenDashboard,
  savedResources,
  onToggleSave,
  onEditResource,
  onDeleteResource
}) => {
  // Group resources by type
  const youtubeResources = topic.resources.filter(r => r.type === 'youtube');
  const githubResources = topic.resources.filter(r => r.type === 'github');
  const courseResources = topic.resources.filter(r => r.type === 'course');
  const projectResources = topic.resources.filter(r => r.type === 'project');
  const docResources = topic.resources.filter(r => r.type === 'documentation');
  const paperResources = topic.resources.filter(r => r.type === 'paper');
  const bookResources = topic.resources.filter(r => r.type === 'book');

  const totalResources = topic.resources.length;

  return (
    <div
      id={`step-node-${topic.id}`}
      className="relative flex flex-col items-center select-none"
    >
      {/* Top Input Connection Terminal Socket */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center pointer-events-none">
        <div className="w-6 h-6 rounded-full bg-[#0D1117] border-2 border-amber-400/80 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.6)]">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. MAJOR ROADMAP TOPIC CARD */}
      {/* ======================================================== */}
      <div
        onClick={() => {
          onSelect(topic.id);
        }}
        className={`group w-[460px] md:w-[480px] rounded-3xl bg-[#0D1117] border-2 transition-all duration-300 cursor-pointer shadow-2xl p-6 relative overflow-hidden backdrop-blur-xl ${
          isSelected
            ? 'border-amber-400 ring-4 ring-amber-500/20 shadow-[0_0_45px_rgba(245,158,11,0.3)]'
            : 'border-slate-800 hover:border-amber-400/60 hover:shadow-[0_10px_35px_rgba(0,0,0,0.7)]'
        }`}
      >
        {/* Top accent glow bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-indigo-600 opacity-90" />

        {/* Top Header Pill & Step Number */}
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-black tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
              STEP {topic.stepNumber}
            </span>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider truncate max-w-[220px]">
              {topic.categoryLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-slate-900 text-cyan-300 border border-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{totalResources} Res</span>
            </span>

            {onToggleExpand && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleExpand(topic.id);
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                  isExpanded
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-extrabold hover:bg-amber-300'
                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:border-amber-400 hover:bg-slate-800'
                }`}
                title={isExpanded ? 'Close Resource Branches' : 'Expand Resource Branches'}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>Close</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 text-amber-400" />
                    <span>Expand</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors tracking-tight leading-snug">
          {topic.title}
        </h3>

        {/* Subtitle / Overview */}
        <p className="text-sm text-slate-300 mt-2 line-clamp-2 leading-relaxed font-sans font-normal">
          {topic.shortSubtitle || topic.overview}
        </p>

        {/* Resource Category Badges Grid */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-xs font-semibold font-mono">
          {youtubeResources.length > 0 && (
            <div className="px-2.5 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[11px]">YT</span>
              </span>
              <span className="font-bold">{youtubeResources.length}</span>
            </div>
          )}

          {githubResources.length > 0 && (
            <div className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px]">GH</span>
              </span>
              <span className="font-bold">{githubResources.length}</span>
            </div>
          )}

          {courseResources.length > 0 && (
            <div className="px-2.5 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UdemyLogo className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[11px]">Udemy</span>
              </span>
              <span className="font-bold">{courseResources.length}</span>
            </div>
          )}

          {projectResources.length > 0 && (
            <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Projects</span>
              </span>
              <span className="font-bold">{projectResources.length}</span>
            </div>
          )}

          {docResources.length > 0 && (
            <div className="px-2.5 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px]">Docs</span>
              </span>
              <span className="font-bold">{docResources.length}</span>
            </div>
          )}

          {paperResources.length > 0 && (
            <div className="px-2.5 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-[11px]">Papers</span>
              </span>
              <span className="font-bold">{paperResources.length}</span>
            </div>
          )}

          {bookResources.length > 0 && (
            <div className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[11px]">Books</span>
              </span>
              <span className="font-bold">{bookResources.length}</span>
            </div>
          )}

          {topic.interviewQuestions && topic.interviewQuestions.length > 0 && (
            <div className="px-2.5 py-1.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-[11px]">Q&A</span>
              </span>
              <span className="font-bold">{topic.interviewQuestions.length}</span>
            </div>
          )}
        </div>

        {/* CTA Bottom Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDashboard(topic.id);
            }}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-4 h-4" />
            <span>Open Learning Hub</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onToggleExpand) {
                onToggleExpand(topic.id);
              }
            }}
            className={`text-[11px] font-mono flex items-center gap-1.5 transition-all px-2.5 py-1 rounded-lg border ${
              isExpanded
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-700 hover:border-slate-500'
            }`}
          >
            {isExpanded ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">Hide Cards</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Show Cards</span>
              </>
            )}
          </button>
        </div>

        {/* Bottom Output Terminal Socket (when collapsed) */}
        {!isExpanded && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 rounded-full bg-[#0D1117] border-2 border-cyan-400/80 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.6)]">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. EXPANDED ROOT RESOURCE NODES */}
      {/* ======================================================== */}
      {isExpanded && (
        <div className="w-full mt-5 flex flex-col items-center transition-all duration-300">
          {/* Downward connecting line */}
          <div className="w-0.5 h-5 bg-gradient-to-b from-amber-400 to-cyan-500 mb-2" />

          {/* Horizontal Root Category Nodes Grid */}
          <div className="flex flex-wrap items-start justify-center gap-4 max-w-[1080px]">
            {youtubeResources.length > 0 && (
              <CategoryRootNode
                type="youtube"
                resources={youtubeResources}
                savedResources={savedResources}
                onToggleSave={onToggleSave}
                onEdit={onEditResource}
                onDelete={onDeleteResource}
              />
            )}

            {githubResources.length > 0 && (
              <CategoryRootNode
                type="github"
                resources={githubResources}
                savedResources={savedResources}
                onToggleSave={onToggleSave}
                onEdit={onEditResource}
                onDelete={onDeleteResource}
              />
            )}

            {courseResources.length > 0 && (
              <CategoryRootNode
                type="course"
                resources={courseResources}
                savedResources={savedResources}
                onToggleSave={onToggleSave}
                onEdit={onEditResource}
                onDelete={onDeleteResource}
              />
            )}

            {projectResources.length > 0 && (
              <CategoryRootNode
                type="project"
                resources={projectResources}
                savedResources={savedResources}
                onToggleSave={onToggleSave}
                onEdit={onEditResource}
                onDelete={onDeleteResource}
              />
            )}

            {docResources.length > 0 && (
              <CategoryRootNode
                type="documentation"
                resources={docResources}
                savedResources={savedResources}
                onToggleSave={onToggleSave}
                onEdit={onEditResource}
                onDelete={onDeleteResource}
              />
            )}

            {paperResources.length > 0 && (
              <CategoryRootNode
                type="paper"
                resources={paperResources}
                savedResources={savedResources}
                onToggleSave={onToggleSave}
                onEdit={onEditResource}
                onDelete={onDeleteResource}
              />
            )}

            {bookResources.length > 0 && (
              <CategoryRootNode
                type="book"
                resources={bookResources}
                savedResources={savedResources}
                onToggleSave={onToggleSave}
                onEdit={onEditResource}
                onDelete={onDeleteResource}
              />
            )}

            {totalResources === 0 && (
              <div className="px-6 py-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 text-center font-mono">
                No active resources currently listed for this step.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
