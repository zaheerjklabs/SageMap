import React, { useState } from 'react';
import { 
  Tv, 
  Github, 
  GraduationCap, 
  Code2, 
  Globe, 
  FileText, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  ExternalLink,
  Search,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';
import { ROADMAP_TOPICS } from '../data/roadmapData';
import { RoadmapTopic, UserCollections } from '../types';
import { UdemyLogo } from './UdemyLogo';

interface CurriculumMatrixViewProps {
  topics?: RoadmapTopic[];
  onOpenTopicDashboard: (topicId: number) => void;
  savedResources: Record<string, boolean>;
  onToggleSave: (resourceId: string) => void;
}

export const CurriculumMatrixView: React.FC<CurriculumMatrixViewProps> = ({
  topics = ROADMAP_TOPICS,
  onOpenTopicDashboard,
  savedResources,
  onToggleSave
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTopics = topics.filter(t => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.overview.toLowerCase().includes(q) ||
        t.coreConcepts.some(c => c.title.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#090A0F] text-slate-100 p-6 custom-scrollbar font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="p-6 rounded-3xl bg-[#0D1117] border border-slate-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Curriculum Knowledge Matrix
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Data Science to Agentic AI Curriculum
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Comparative matrix view across all {topics.length} specialization steps, learning pathways, and resource distributions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search matrix..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Matrix Rows */}
        <div className="space-y-4">
          {filteredTopics.map((topic) => {
            const ytCount = topic.resources.filter(r => r.type === 'youtube').length;
            const ghCount = topic.resources.filter(r => r.type === 'github').length;
            const courseCount = topic.resources.filter(r => r.type === 'course').length;
            const projectCount = topic.resources.filter(r => r.type === 'project').length;
            const docCount = topic.resources.filter(r => r.type === 'documentation').length;
            const paperCount = topic.resources.filter(r => r.type === 'paper').length;
            const bookCount = topic.resources.filter(r => r.type === 'book').length;

            return (
              <div
                key={topic.id}
                onClick={() => onOpenTopicDashboard(topic.id)}
                className="group p-5 rounded-2xl bg-[#0D1117] border border-slate-800 hover:border-amber-400/80 transition-all duration-200 shadow-xl cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Title & Overview */}
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        STEP {topic.stepNumber}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {topic.categoryLabel}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {topic.overview}
                    </p>

                    {/* Core concepts badges */}
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      {topic.coreConcepts.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 text-cyan-300 border border-slate-800"
                        >
                          {c.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Middle Column: Resource Counters */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center text-xs font-mono font-bold shrink-0">
                    <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300">
                      <Tv className="w-3.5 h-3.5 mx-auto mb-1 text-red-400" />
                      <div>{ytCount}</div>
                      <div className="text-[9px] text-slate-400 font-sans">YT</div>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                      <Github className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
                      <div>{ghCount}</div>
                      <div className="text-[9px] text-slate-400 font-sans">GitHub</div>
                    </div>

                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300">
                      <UdemyLogo className="w-3.5 h-3.5 mx-auto mb-1 text-purple-400" />
                      <div>{courseCount}</div>
                      <div className="text-[9px] text-slate-400 font-sans">Udemy</div>
                    </div>

                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      <Code2 className="w-3.5 h-3.5 mx-auto mb-1 text-amber-400" />
                      <div>{projectCount}</div>
                      <div className="text-[9px] text-slate-400 font-sans">Projects</div>
                    </div>

                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300">
                      <Globe className="w-3.5 h-3.5 mx-auto mb-1 text-blue-400" />
                      <div>{docCount}</div>
                      <div className="text-[9px] text-slate-400 font-sans">Docs</div>
                    </div>

                    <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300">
                      <FileText className="w-3.5 h-3.5 mx-auto mb-1 text-teal-400" />
                      <div>{paperCount}</div>
                      <div className="text-[9px] text-slate-400 font-sans">Papers</div>
                    </div>

                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                      <BookOpen className="w-3.5 h-3.5 mx-auto mb-1 text-rose-400" />
                      <div>{bookCount}</div>
                      <div className="text-[9px] text-slate-400 font-sans">Books</div>
                    </div>
                  </div>

                  {/* Right Column: CTA */}
                  <div className="flex items-center justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTopicDashboard(topic.id);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 group-hover:bg-amber-500 text-slate-300 group-hover:text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-all border border-slate-800 group-hover:border-amber-400"
                    >
                      <span>Open Hub</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
