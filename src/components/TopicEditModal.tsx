import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Edit3, 
  Layers, 
  ListOrdered, 
  FileCode2, 
  Wrench, 
  Plus, 
  Trash2, 
  ExternalLink 
} from 'lucide-react';
import { RoadmapTopic, CoreConcept, TopicSubtopic, ToolFramework } from '../types';

interface TopicEditModalProps {
  topic: RoadmapTopic | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveTopic: (updatedTopic: RoadmapTopic) => void;
}

type ModalTab = 'overview' | 'order' | 'concepts' | 'subtopics' | 'tools';

export const TopicEditModal: React.FC<TopicEditModalProps> = ({
  topic,
  isOpen,
  onClose,
  onSaveTopic
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('overview');

  // 1. Overview & Meta State
  const [stepNumber, setStepNumber] = useState('');
  const [title, setTitle] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [shortSubtitle, setShortSubtitle] = useState('');
  const [overview, setOverview] = useState('');

  // 2. Recommended Order State
  const [recommendedOrder, setRecommendedOrder] = useState<string[]>([]);
  const [newOrderStep, setNewOrderStep] = useState('');

  // 3. Core Concepts State
  const [coreConcepts, setCoreConcepts] = useState<CoreConcept[]>([]);

  // 4. Subtopics State
  const [subtopics, setSubtopics] = useState<TopicSubtopic[]>([]);

  // 5. Tools & Frameworks State
  const [toolsAndFrameworks, setToolsAndFrameworks] = useState<ToolFramework[]>([]);

  useEffect(() => {
    if (topic) {
      setStepNumber(topic.stepNumber || '');
      setTitle(topic.title || '');
      setCategoryLabel(topic.categoryLabel || '');
      setShortSubtitle(topic.shortSubtitle || '');
      setOverview(topic.overview || '');
      setRecommendedOrder(topic.recommendedOrder ? [...topic.recommendedOrder] : []);
      setCoreConcepts(topic.coreConcepts ? topic.coreConcepts.map((c) => ({ ...c })) : []);
      setSubtopics(topic.subtopics ? topic.subtopics.map((s) => ({ ...s, skills: [...(s.skills || [])] })) : []);
      setToolsAndFrameworks(topic.toolsAndFrameworks ? topic.toolsAndFrameworks.map((t) => ({ ...t })) : []);
      setActiveTab('overview');
    }
  }, [topic, isOpen]);

  if (!isOpen || !topic) return null;

  // --- Handlers for Recommended Order ---
  const handleAddOrderStep = () => {
    if (!newOrderStep.trim()) return;
    setRecommendedOrder([...recommendedOrder, newOrderStep.trim()]);
    setNewOrderStep('');
  };

  const handleRemoveOrderStep = (index: number) => {
    setRecommendedOrder(recommendedOrder.filter((_, i) => i !== index));
  };

  const handleOrderChange = (index: number, val: string) => {
    const updated = [...recommendedOrder];
    updated[index] = val;
    setRecommendedOrder(updated);
  };

  // --- Handlers for Core Concepts ---
  const handleAddConcept = () => {
    setCoreConcepts([
      ...coreConcepts,
      {
        title: 'New Core Concept',
        description: 'Detailed explanation of this foundational concept and why it matters.',
        tag: 'Core Mastery'
      }
    ]);
  };

  const handleRemoveConcept = (index: number) => {
    setCoreConcepts(coreConcepts.filter((_, i) => i !== index));
  };

  const handleConceptChange = (index: number, field: keyof CoreConcept, val: string) => {
    const updated = [...coreConcepts];
    updated[index] = { ...updated[index], [field]: val };
    setCoreConcepts(updated);
  };

  // --- Handlers for Subtopics ---
  const handleAddSubtopic = () => {
    setSubtopics([
      ...subtopics,
      {
        id: `sub-${Date.now()}`,
        title: 'New Curriculum Module',
        description: 'Module learning objectives and key topics covered.',
        skills: ['Key Skill 1', 'Key Skill 2']
      }
    ]);
  };

  const handleRemoveSubtopic = (index: number) => {
    setSubtopics(subtopics.filter((_, i) => i !== index));
  };

  const handleSubtopicChange = (index: number, field: keyof TopicSubtopic, val: any) => {
    const updated = [...subtopics];
    updated[index] = { ...updated[index], [field]: val };
    setSubtopics(updated);
  };

  // --- Handlers for Frameworks & Tools ---
  const handleAddTool = () => {
    setToolsAndFrameworks([
      ...toolsAndFrameworks,
      {
        name: 'New Tool / Framework',
        category: 'Development / Serving',
        description: 'High-performance library or framework used in production.',
        url: 'https://github.com'
      }
    ]);
  };

  const handleRemoveTool = (index: number) => {
    setToolsAndFrameworks(toolsAndFrameworks.filter((_, i) => i !== index));
  };

  const handleToolChange = (index: number, field: keyof ToolFramework, val: string) => {
    const updated = [...toolsAndFrameworks];
    updated[index] = { ...updated[index], [field]: val };
    setToolsAndFrameworks(updated);
  };

  // --- Submit All Changes ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updatedTopic: RoadmapTopic = {
      ...topic,
      stepNumber: stepNumber.trim() || topic.stepNumber,
      title: title.trim(),
      categoryLabel: categoryLabel.trim(),
      shortSubtitle: shortSubtitle.trim(),
      overview: overview.trim(),
      recommendedOrder,
      coreConcepts,
      subtopics,
      toolsAndFrameworks
    };

    onSaveTopic(updatedTopic);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans select-none">
      <div className="w-full max-w-4xl bg-[#0D1117] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  STEP {stepNumber || topic.stepNumber}
                </span>
                <h3 className="text-base font-black text-white truncate max-w-md">
                  Admin Edit: {title || topic.title}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full administrative access to edit curriculum overview, core concepts, subtopics, recommended order & tools
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

        {/* Modal Tab Navigation */}
        <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Overview & Titles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('order')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'order'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Recommended Order ({recommendedOrder.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('concepts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'concepts'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Core Concepts ({coreConcepts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subtopics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'subtopics'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Curriculum Subtopics ({subtopics.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'tools'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Frameworks & Tools ({toolsAndFrameworks.length})</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          
          {/* TAB 1: OVERVIEW & TITLES */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-fadeIn">
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
                  placeholder="e.g. Core Foundations"
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
            </div>
          )}

          {/* TAB 2: RECOMMENDED LEARNING ORDER */}
          {activeTab === 'order' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Recommended Learning Sequence
                  </h4>
                  <p className="text-xs text-slate-400">
                    Define the step-by-step path students should follow to master this topic.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {recommendedOrder.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 p-2 rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-amber-500/30">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleOrderChange(idx, e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOrderStep(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove step"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="Enter next recommended step..."
                  value={newOrderStep}
                  onChange={(e) => setNewOrderStep(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOrderStep();
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleAddOrderStep}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Step</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: WHAT TO LEARN & CORE CONCEPTS */}
          {activeTab === 'concepts' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    What to Learn & Core Concepts
                  </h4>
                  <p className="text-xs text-slate-400">
                    Define foundational concepts, architecture paradigms, and key learning pillars.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddConcept}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Concept</span>
                </button>
              </div>

              <div className="space-y-3">
                {coreConcepts.map((concept, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Concept Title"
                          value={concept.title}
                          onChange={(e) => handleConceptChange(idx, 'title', e.target.value)}
                          className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-100 focus:outline-none focus:border-cyan-400"
                        />
                        <input
                          type="text"
                          placeholder="Tag (e.g. Async Core)"
                          value={concept.tag}
                          onChange={(e) => handleConceptChange(idx, 'tag', e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveConcept(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Concept"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Concept description and significance..."
                      value={concept.description}
                      onChange={(e) => handleConceptChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CURRICULUM SUBTOPICS */}
          {activeTab === 'subtopics' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Curriculum Subtopics & Modules
                  </h4>
                  <p className="text-xs text-slate-400">
                    Structured syllabus modules with associated technical skills.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSubtopic}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subtopic</span>
                </button>
              </div>

              <div className="space-y-3">
                {subtopics.map((sub, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        placeholder="Subtopic Title"
                        value={sub.title}
                        onChange={(e) => handleSubtopicChange(idx, 'title', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-100 focus:outline-none focus:border-purple-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtopic(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Subtopic"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Subtopic description..."
                      value={sub.description}
                      onChange={(e) => handleSubtopicChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-400 leading-relaxed"
                    />

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        Skills (comma separated):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Generators, asyncio, uv, Typer"
                        value={sub.skills ? sub.skills.join(', ') : ''}
                        onChange={(e) => {
                          const skillsArr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                          handleSubtopicChange(idx, 'skills', skillsArr);
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FRAMEWORKS & TOOLS */}
          {activeTab === 'tools' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Industry Frameworks & Developer Tools
                  </h4>
                  <p className="text-xs text-slate-400">
                    Recommended production frameworks, libraries, SDKs, and developer tools.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTool}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tool</span>
                </button>
              </div>

              <div className="space-y-3">
                {toolsAndFrameworks.map((tool, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Tool Name (e.g. FastAPI)"
                          value={tool.name}
                          onChange={(e) => handleToolChange(idx, 'name', e.target.value)}
                          className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-100 focus:outline-none focus:border-purple-400"
                        />
                        <input
                          type="text"
                          placeholder="Category (e.g. API Framework)"
                          value={tool.category}
                          onChange={(e) => handleToolChange(idx, 'category', e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTool(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Tool"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="url"
                      placeholder="Tool URL (https://...)"
                      value={tool.url}
                      onChange={(e) => handleToolChange(idx, 'url', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400 focus:outline-none focus:border-purple-400"
                    />

                    <textarea
                      rows={2}
                      placeholder="Brief description of the tool..."
                      value={tool.description}
                      onChange={(e) => handleToolChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-400 leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-slate-400">
              Changes will update live across all Roadmap and Explorer views.
            </div>

            <div className="flex items-center gap-2.5">
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
                <span>Save All Curriculum Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
