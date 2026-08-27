import React, { useState, useEffect } from 'react';
import { X, Check, Edit3, Sparkles, BookOpen, Layers } from 'lucide-react';
import { RoadmapTopic } from '../types';

interface TopicEditModalProps {
  topic: RoadmapTopic | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveTopic: (updatedTopic: RoadmapTopic) => void;
}

export const TopicEditModal: React.FC<TopicEditModalProps> = ({
  topic,
  isOpen,
  onClose,
  onSaveTopic
}) => {
  const [title, setTitle] = useState('');
  const [shortSubtitle, setShortSubtitle] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [overview, setOverview] = useState('');
  const [stepNumber, setStepNumber] = useState('');

  useEffect(() => {
    if (topic) {
      setTitle(topic.title || '');
      setShortSubtitle(topic.shortSubtitle || '');
      setCategoryLabel(topic.categoryLabel || '');
      setOverview(topic.overview || '');
      setStepNumber(topic.stepNumber || '');
    }
  }, [topic, isOpen]);

  if (!isOpen || !topic) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updatedTopic: RoadmapTopic = {
      ...topic,
      title: title.trim(),
      shortSubtitle: shortSubtitle.trim(),
      categoryLabel: categoryLabel.trim(),
      overview: overview.trim(),
      stepNumber: stepNumber.trim() || topic.stepNumber
    };

    onSaveTopic(updatedTopic);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans select-none">
      <div className="w-full max-w-2xl bg-[#0D1117] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Edit Topic & Curriculum Content
              </h3>
              <p className="text-xs text-slate-400">
                Modify Step {topic.stepNumber} titles, subtitles, category tags, and curriculum overview
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Step Number
              </label>
              <input
                type="text"
                value={stepNumber}
                onChange={(e) => setStepNumber(e.target.value)}
                placeholder="01"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400 text-center"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Topic Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Python Programming"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Category Pillar Tag
            </label>
            <input
              type="text"
              value={categoryLabel}
              onChange={(e) => setCategoryLabel(e.target.value)}
              placeholder="e.g. Core Programming Foundations"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Short Subtitle / Focus Highlights
            </label>
            <input
              type="text"
              value={shortSubtitle}
              onChange={(e) => setShortSubtitle(e.target.value)}
              placeholder="e.g. Clean OOP, Type Hinting, Asynchronous Coroutines, uv & High-Performance Libraries"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Detailed Curriculum Overview Description
            </label>
            <textarea
              rows={4}
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="Detailed description of what is covered in this mastery step..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400 leading-relaxed"
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
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Save Topic Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
