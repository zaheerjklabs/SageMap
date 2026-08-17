import React, { useState } from 'react';
import { 
  X, 
  Tv, 
  Github, 
  GraduationCap, 
  Code2, 
  Globe, 
  FileText, 
  BookOpen, 
  Newspaper, 
  Sparkles,
  Plus
} from 'lucide-react';
import { ROADMAP_TOPICS } from '../data/roadmapData';
import { ResourceItem, ResourceType, DifficultyLevel } from '../types';

interface AddCustomResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveResource: (resource: ResourceItem) => void;
  initialTopicId?: number;
}

export const AddCustomResourceModal: React.FC<AddCustomResourceModalProps> = ({
  isOpen,
  onClose,
  onSaveResource,
  initialTopicId = 1
}) => {
  const [topicId, setTopicId] = useState<number>(initialTopicId);
  const [type, setType] = useState<ResourceType>('youtube');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Intermediate');
  const [channelOrAuthor, setChannelOrAuthor] = useState('');
  const [durationOrStars, setDurationOrStars] = useState('');
  const [technologiesText, setTechnologiesText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    const techs = technologiesText
      ? technologiesText.split(',').map(t => t.trim()).filter(Boolean)
      : ['AI', 'Python'];

    const newResource: ResourceItem = {
      id: `custom-${Date.now()}`,
      topicId,
      type,
      title: title.trim(),
      url: url.trim(),
      description: description.trim() || 'Community-contributed resource.',
      difficulty,
      technologies: techs,
      isCustom: true,
      ...(type === 'youtube' && { channelName: channelOrAuthor, duration: durationOrStars }),
      ...(type === 'github' && { author: channelOrAuthor, stars: durationOrStars }),
      ...(type === 'course' && { instructor: channelOrAuthor, platform: 'Udemy' }),
      ...(type === 'paper' && { authors: channelOrAuthor, year: durationOrStars }),
      ...(type === 'book' && { bookAuthor: channelOrAuthor, bookYear: durationOrStars }),
      ...(type === 'documentation' && { siteName: channelOrAuthor }),
      ...(type === 'article' && { publication: channelOrAuthor })
    };

    onSaveResource(newResource);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className="w-full max-w-xl bg-[#0D1117] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Add Learning Resource</h3>
              <p className="text-xs text-slate-400">Contribute a repository, video, course, paper, or project</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Target Topic Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Roadmap Topic Phase
            </label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              {ROADMAP_TOPICS.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  Step {topic.stepNumber}: {topic.title}
                </option>
              ))}
            </select>
          </div>

          {/* Resource Category Type */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Resource Category
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
              {[
                { id: 'youtube', label: 'YouTube', icon: <Tv className="w-3.5 h-3.5 text-red-400" /> },
                { id: 'github', label: 'GitHub', icon: <Github className="w-3.5 h-3.5 text-emerald-400" /> },
                { id: 'course', label: 'Course', icon: <GraduationCap className="w-3.5 h-3.5 text-purple-400" /> },
                { id: 'project', label: 'Project', icon: <Code2 className="w-3.5 h-3.5 text-amber-400" /> },
                { id: 'documentation', label: 'Docs', icon: <Globe className="w-3.5 h-3.5 text-blue-400" /> },
                { id: 'paper', label: 'Paper', icon: <FileText className="w-3.5 h-3.5 text-teal-400" /> },
                { id: 'book', label: 'Book', icon: <BookOpen className="w-3.5 h-3.5 text-rose-400" /> },
                { id: 'article', label: 'Article', icon: <Newspaper className="w-3.5 h-3.5 text-cyan-400" /> }
              ].map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setType(cat.id as ResourceType)}
                  className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    type === cat.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.icon}
                  <span className="text-[11px]">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Resource Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Build an Autonomous Agent with LangGraph & Python"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* URL */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Resource URL *
            </label>
            <input
              type="url"
              required
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Short Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief summary of why this resource is valuable..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Author / Creator & Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Author / Channel / Creator
              </label>
              <input
                type="text"
                placeholder="e.g. Andrej Karpathy, Stanford"
                value={channelOrAuthor}
                onChange={(e) => setChannelOrAuthor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Duration / Stars / Year
              </label>
              <input
                type="text"
                placeholder="e.g. 2.5 hours, 45k+, 2024"
                value={durationOrStars}
                onChange={(e) => setDurationOrStars(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Technologies Tag input */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Technologies / Skills (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. PyTorch, LoRA, CUDA, LangGraph"
              value={technologiesText}
              onChange={(e) => setTechnologiesText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20"
            >
              Save Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
