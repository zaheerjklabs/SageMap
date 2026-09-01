import React, { useState, useEffect } from 'react';
import { 
  X, 
  Tv, 
  ListVideo,
  Github, 
  GraduationCap, 
  Code2, 
  Globe, 
  FileText, 
  BookOpen, 
  Newspaper, 
  Sparkles, 
  Plus, 
  Edit3, 
  Check,
  PlaySquare
} from 'lucide-react';
import { ROADMAP_TOPICS } from '../data/roadmapData';
import { ResourceItem, ResourceType, DifficultyLevel } from '../types';
import { parseYouTubeUrl } from '../utils/youtubeUtils';

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveResource: (resource: ResourceItem, isEdit: boolean) => void;
  initialTopicId?: number;
  editingResource?: ResourceItem | null;
}

export const ResourceModal: React.FC<ResourceModalProps> = ({
  isOpen,
  onClose,
  onSaveResource,
  initialTopicId = 1,
  editingResource = null
}) => {
  const isEdit = Boolean(editingResource);

  const [topicId, setTopicId] = useState<number>(initialTopicId);
  const [type, setType] = useState<ResourceType>('youtube');
  const [videoType, setVideoType] = useState<string>('Playlist');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<string>('Coursera');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Intermediate');
  const [channelOrAuthor, setChannelOrAuthor] = useState('');
  const [durationOrStars, setDurationOrStars] = useState('');
  const [technologiesText, setTechnologiesText] = useState('');

  const [imageUrl, setImageUrl] = useState('');

  const [learningOutcomesText, setLearningOutcomesText] = useState('');
  const [prerequisitesText, setPrerequisitesText] = useState('');
  const [highlightsText, setHighlightsText] = useState('');

  // Sync form values when opening or when editingResource changes
  useEffect(() => {
    if (editingResource) {
      setTopicId(editingResource.topicId);
      setType(editingResource.type);
      setVideoType(
        editingResource.videoType ||
        (editingResource.type === 'youtube' && parseYouTubeUrl(editingResource.url).isPlaylist ? 'Playlist' : 'Full Course')
      );
      setTitle(editingResource.title || '');
      setUrl(editingResource.url || '');
      setPlatform(editingResource.platform || (editingResource.url?.includes('udemy.com') ? 'Udemy' : 'Coursera'));
      setImageUrl(editingResource.imageUrl || editingResource.thumbnailUrl || '');
      setDescription(editingResource.description || '');
      setDifficulty(editingResource.difficulty || 'Intermediate');
      setTechnologiesText(editingResource.technologies ? editingResource.technologies.join(', ') : '');
      setLearningOutcomesText(editingResource.learningOutcomes ? editingResource.learningOutcomes.join('\n') : '');
      setPrerequisitesText(editingResource.prerequisites ? editingResource.prerequisites.join('\n') : '');
      setHighlightsText(editingResource.keyHighlights ? editingResource.keyHighlights.join('\n') : '');

      // Set specific author / channel / instructor
      const authorVal = 
        editingResource.channelName ||
        editingResource.author ||
        editingResource.instructor ||
        editingResource.authors ||
        editingResource.bookAuthor ||
        editingResource.siteName ||
        editingResource.publication ||
        '';
      setChannelOrAuthor(authorVal);

      // Set specific duration / stars / year
      const metaVal = 
        editingResource.duration ||
        editingResource.stars ||
        (editingResource.year ? String(editingResource.year) : '') ||
        (editingResource.bookYear ? String(editingResource.bookYear) : '') ||
        '';
      setDurationOrStars(metaVal);
    } else {
      setTopicId(initialTopicId);
      setType('youtube');
      setVideoType('Playlist');
      setTitle('');
      setUrl('');
      setPlatform('Coursera');
      setDescription('');
      setDifficulty('Intermediate');
      setChannelOrAuthor('');
      setDurationOrStars('');
      setTechnologiesText('');
      setImageUrl('');
      setLearningOutcomesText('');
      setPrerequisitesText('');
      setHighlightsText('');
    }
  }, [editingResource, initialTopicId, isOpen]);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    const trimmed = newUrl.trim().toLowerCase();
    if (trimmed.includes('coursera.org')) {
      setType('course');
      setPlatform('Coursera');
    } else if (trimmed.includes('udemy.com')) {
      setType('course');
      setPlatform('Udemy');
    } else if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      setType('youtube');
      const ytInfo = parseYouTubeUrl(newUrl);
      if (ytInfo.isPlaylist) {
        setVideoType('Playlist');
      } else if (ytInfo.videoId) {
        setVideoType('Full Course');
      }
    } else if (trimmed.includes('github.com')) {
      setType('github');
    } else if (trimmed.includes('arxiv.org')) {
      setType('paper');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    const techs = technologiesText
      ? technologiesText.split(',').map((t) => t.trim()).filter(Boolean)
      : ['AI', 'Machine Learning'];

    const outcomes = learningOutcomesText
      ? learningOutcomesText.split('\n').map((l) => l.trim()).filter(Boolean)
      : undefined;

    const prereqs = prerequisitesText
      ? prerequisitesText.split('\n').map((l) => l.trim()).filter(Boolean)
      : undefined;

    const highlights = highlightsText
      ? highlightsText.split('\n').map((l) => l.trim()).filter(Boolean)
      : undefined;

    let finalImageUrl = imageUrl.trim();
    const ytInfo = type === 'youtube' ? parseYouTubeUrl(url) : null;

    if (!finalImageUrl) {
      if (url.includes('udemy.com')) {
        finalImageUrl = `https://api.microlink.io/?url=${encodeURIComponent(url.trim().split('?')[0])}&embed=image.url`;
      } else if (url.includes('github.com')) {
        const ghMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (ghMatch && ghMatch[1] && ghMatch[2]) {
          const owner = ghMatch[1];
          const repo = ghMatch[2].replace(/\.git$/, '').split('#')[0].split('?')[0];
          finalImageUrl = `https://opengraph.githubassets.com/1/${owner}/${repo}`;
        }
      } else if (ytInfo && ytInfo.videoId) {
        finalImageUrl = `https://img.youtube.com/vi/${ytInfo.videoId}/hqdefault.jpg`;
      }
    }

    const resourceId = editingResource ? editingResource.id : `custom-${Date.now()}`;

    const updatedResource: ResourceItem = {
      ...(editingResource || {}),
      id: resourceId,
      topicId,
      type,
      title: title.trim(),
      url: url.trim(),
      imageUrl: finalImageUrl || undefined,
      description: description.trim() || 'Curated AI & ML learning resource.',
      difficulty,
      technologies: techs,
      learningOutcomes: outcomes,
      prerequisites: prereqs,
      keyHighlights: highlights,
      isCustom: editingResource ? (editingResource.isCustom ?? false) : true,
      isEdited: isEdit ? true : undefined,
      ...(type === 'youtube' && { 
        channelName: channelOrAuthor, 
        duration: durationOrStars,
        videoType: (videoType as any) || (ytInfo?.isPlaylist ? 'Playlist' : 'Full Course'),
        playlistId: ytInfo?.playlistId,
        videoCount: durationOrStars && durationOrStars.toLowerCase().includes('video') ? durationOrStars : undefined
      }),
      ...(type === 'github' && { author: channelOrAuthor, stars: durationOrStars }),
      ...(type === 'course' && { 
        instructor: channelOrAuthor, 
        platform: (platform as any) || (url.includes('udemy.com') ? 'Udemy' : 'Coursera') 
      }),
      ...(type === 'paper' && { authors: channelOrAuthor, year: durationOrStars, venue: editingResource?.venue || 'arXiv' }),
      ...(type === 'book' && { bookAuthor: channelOrAuthor, bookYear: durationOrStars }),
      ...(type === 'documentation' && { siteName: channelOrAuthor }),
      ...(type === 'article' && { publication: channelOrAuthor })
    };

    onSaveResource(updatedResource, isEdit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans select-none">
      <div className="w-full max-w-2xl bg-[#0D1117] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isEdit 
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
            }`}>
              {isEdit ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {isEdit ? 'Edit Resource Content & Metadata' : 'Add New Learning Resource'}
              </h3>
              <p className="text-xs text-slate-400">
                Full administrative access to edit title, image, descriptions, outcomes, and tags
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors"
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
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-400"
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
                { id: 'youtube', label: 'YouTube / Playlists', icon: <ListVideo className="w-3.5 h-3.5 text-red-400" /> },
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
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.icon}
                  <span className="text-[11px] truncate">{cat.label}</span>
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
              placeholder={type === 'youtube' && videoType === 'Playlist' ? "e.g. Complete GenAI & Multi-Agent Systems Masterclass Playlist" : "e.g. Build an Autonomous Agent with LangGraph & Python"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* URL */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>Resource URL *</span>
              {type === 'youtube' && (
                <span className="text-[10px] text-red-400 font-normal">Supports single videos & full playlist links</span>
              )}
            </label>
            <input
              type="url"
              required
              placeholder={type === 'youtube' ? "https://www.youtube.com/playlist?list=... or https://youtube.com/watch?v=..." : "https://..."}
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono text-[11px]"
            />
          </div>

          {/* YouTube Content Format Selector (When type === 'youtube') */}
          {type === 'youtube' && (
            <div className="p-3 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                  <ListVideo className="w-3.5 h-3.5 text-red-400" />
                  <span>YouTube Content Format</span>
                </label>
                {url && (
                  <span className="text-[10px] font-mono font-bold text-red-300">
                    {parseYouTubeUrl(url).isPlaylist ? '✨ Playlist Detected' : (parseYouTubeUrl(url).videoId ? '🎬 Single Video Detected' : '')}
                  </span>
                )}
              </div>
              <select
                value={videoType}
                onChange={(e) => setVideoType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-red-500/40 text-xs font-bold text-red-200 focus:outline-none focus:border-red-400"
              >
                <option value="Playlist">YouTube Playlist (Full Video Series / Curriculum)</option>
                <option value="Full Course">Full Course (Single Long Video / Masterclass)</option>
                <option value="Tutorial">Tutorial (Hands-on Step-by-Step Lesson)</option>
                <option value="Deep Dive">Deep Dive (Technical Architecture & Code)</option>
                <option value="Crash Course">Crash Course (Fast-Paced Fundamentals)</option>
              </select>
            </div>
          )}

          {/* Custom Banner Image URL with Live Preview */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>Thumbnail / Image URL</span>
              <span className="text-[10px] text-amber-400 font-normal">
                {type === 'youtube' ? 'Auto-extracted from YouTube or enter custom image' : 'Direct image URL (JPG, PNG, WebP)'}
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder={type === 'youtube' ? "Auto-generated from YouTube (or paste custom URL)" : "https://images.unsplash.com/... or any direct image URL"}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono text-[11px]"
              />
              {imageUrl && (
                <div className="w-10 h-9 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-950">
                  <img src={imageUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>
          </div>

          {/* Course Platform Selector (When type === 'course') */}
          {type === 'course' && (
            <div>
              <label className="text-xs font-bold text-purple-400 block mb-1.5">
                Course Provider / Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-purple-500/40 text-xs font-bold text-purple-200 focus:outline-none focus:border-purple-400"
              >
                <option value="Coursera">Coursera (Specialization / University)</option>
                <option value="Udemy">Udemy (Masterclass / Hands-on Course)</option>
                <option value="DeepLearning.AI">DeepLearning.AI</option>
                <option value="Stanford Online">Stanford Online</option>
                <option value="Fast.ai">Fast.ai</option>
                <option value="MIT OpenCourseWare">MIT OpenCourseWare</option>
                <option value="edX">edX</option>
                <option value="FreeCodeCamp">FreeCodeCamp</option>
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Overview Description
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary of what will be learned or why this is essential..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400 leading-relaxed"
            />
          </div>

          {/* What You Will Learn (One per line) */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>What You Will Learn (1 outcome per line)</span>
              <span className="text-[10px] text-emerald-400 font-mono">Generates green checkmark list</span>
            </label>
            <textarea
              rows={3}
              placeholder={`Build modular production pipelines\nMaster prompt chaining & structured tool calling\nOptimize vector embedding retrieval latency`}
              value={learningOutcomesText}
              onChange={(e) => setLearningOutcomesText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400 leading-relaxed font-mono text-[11px]"
            />
          </div>

          {/* Prerequisites (One per line) */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Prerequisites (1 requirement per line)
            </label>
            <textarea
              rows={2}
              placeholder={`Intermediate Python 3.11+ async knowledge\nBasic understanding of LLM prompt structures`}
              value={prerequisitesText}
              onChange={(e) => setPrerequisitesText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400 leading-relaxed font-mono text-[11px]"
            />
          </div>

          {/* Difficulty & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
                <option value="Beginner to Intermediate">Beginner to Intermediate</option>
                <option value="Intermediate to Advanced">Intermediate to Advanced</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Author / Channel / Creator
              </label>
              <input
                type="text"
                placeholder="e.g. Andrej Karpathy, Stanford, Anthropic"
                value={channelOrAuthor}
                onChange={(e) => setChannelOrAuthor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Duration / Stars / Year */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Duration / Stars / Release Year / Platform
            </label>
            <input
              type="text"
              placeholder="e.g. 2.5 hours, 45k+ stars, 2024"
              value={durationOrStars}
              onChange={(e) => setDurationOrStars(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Technologies Tag input */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Technologies / Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. PyTorch, LoRA, CUDA, LangGraph"
              value={technologiesText}
              onChange={(e) => setTechnologiesText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl font-extrabold text-xs shadow-lg flex items-center gap-1.5 transition-all ${
                isEdit
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 shadow-cyan-500/20'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{isEdit ? 'Save Changes' : 'Add Resource'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
