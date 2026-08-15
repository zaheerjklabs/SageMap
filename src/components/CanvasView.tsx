import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  Maximize2, 
  Navigation, 
  Sparkles, 
  ArrowDownCircle, 
  ArrowRightCircle, 
  Expand, 
  Shrink,
  CheckCircle2,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { ROADMAP_TOPICS } from '../data/roadmapData';
import { CanvasTransform, RoadmapTopic, ResourceItem } from '../types';
import { StepNode } from './StepNode';
import { computeGraphLayout } from '../utils/graphLayout';

interface CanvasViewProps {
  topics?: RoadmapTopic[];
  currentTopicId: number;
  onSelectTopic: (topicId: number) => void;
  onOpenDashboard: (topicId: number) => void;
  savedResources: Record<string, boolean>;
  onToggleSave: (resourceId: string) => void;
  onEditResource?: (resource: ResourceItem) => void;
  onDeleteResource?: (resource: ResourceItem) => void;
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  topics = ROADMAP_TOPICS,
  currentTopicId,
  onSelectTopic,
  onOpenDashboard,
  savedResources,
  onToggleSave,
  onEditResource,
  onDeleteResource
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Default zoom is set to balanced medium zoom (0.85 / 85%)
  const [transform, setTransform] = useState<CanvasTransform>({ x: 0, y: 80, scale: 0.85 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Layout configuration state: Vertical Flow Roadmap
  const direction: 'TB' = 'TB';
  const [accordionMode, setAccordionMode] = useState<boolean>(false);
  
  // All topics start completely COLLAPSED when the website first loads
  const [expandedTopicIds, setExpandedTopicIds] = useState<Set<number>>(() => new Set());

  // Toggle individual topic expansion (Close / Expand)
  const handleToggleExpand = useCallback((topicId: number) => {
    setExpandedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
        setAccordionMode(false);
      } else {
        if (accordionMode) {
          return new Set([topicId]);
        }
        next.add(topicId);
      }
      return next;
    });
  }, [accordionMode]);

  // Expand all steps
  const handleExpandAll = () => {
    setAccordionMode(false);
    setExpandedTopicIds(new Set(topics.map(t => t.id)));
  };

  // Collapse all steps
  const handleCollapseAll = () => {
    setAccordionMode(false);
    setExpandedTopicIds(new Set());
  };

  // Compute graph layout using Dagre
  const layout = useMemo(() => {
    return computeGraphLayout(topics, {
      direction,
      ranksep: direction === 'TB' ? 240 : 320,
      nodesep: 160,
      expandedTopicIds
    });
  }, [topics, direction, expandedTopicIds]);

  // Keep a stable ref to the latest layout to prevent dependency loops
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  // Center canvas on a specific topic at medium balanced zoom
  const centerOnTopic = useCallback((topicId: number) => {
    const activeLayout = layoutRef.current;
    const node = activeLayout.nodes.find(n => n.topicId === topicId);
    if (!node || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const targetScale = 0.85;
    const newX = (containerWidth / 2) - (node.x * targetScale);
    const newY = (containerHeight / 3) - (node.y * targetScale);

    setTransform({
      x: newX,
      y: newY,
      scale: targetScale
    });
  }, []);

  // Center on topic when currentTopicId changes
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      centerOnTopic(currentTopicId);
    });
    return () => cancelAnimationFrame(frameId);
  }, [currentTopicId, centerOnTopic]);

  // Zoom handlers with stepped increments
  const handleZoomIn = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(Number((prev.scale + 0.15).toFixed(2)), 2.2)
    }));
  };

  const handleZoomOut = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(Number((prev.scale - 0.15).toFixed(2)), 0.35)
    }));
  };

  const handleResetZoom = () => {
    centerOnTopic(currentTopicId);
  };

  const handleFitRoadmap = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      const scaleX = (containerWidth - 80) / layout.width;
      const scaleY = (containerHeight - 80) / layout.height;
      const fitScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 0.85);

      setTransform({
        x: (containerWidth / 2) - ((layout.width / 2) * fitScale),
        y: 80,
        scale: fitScale
      });
    }
  };

  // Pan interaction handlers with smooth cursor feedback
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - transform.x,
      y: e.clientY - transform.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Do NOT zoom on mouse scroll; instead pan/scroll the map canvas vertically and horizontally
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setTransform(prev => ({
      ...prev,
      x: prev.x - (e.shiftKey ? e.deltaY : (e.deltaX || 0)),
      y: prev.y - (e.shiftKey ? 0 : e.deltaY)
    }));
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="relative flex-1 h-full w-full bg-[#090A0F] overflow-hidden select-none cursor-grab active:cursor-grabbing font-sans"
    >
      {/* Background Matrix Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `radial-gradient(#3B82F6 1.2px, transparent 1.2px)`,
          backgroundSize: '32px 32px',
          backgroundPosition: `${transform.x % 32}px ${transform.y % 32}px`
        }}
      />

      {/* ======================================================== */}
      {/* FIXED COMPACT VERTICAL RIGHT-SIDE CONTROLS DOCK */}
      {/* ======================================================== */}
      <div 
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className="fixed top-20 right-4 z-40 flex flex-col items-stretch gap-1.5 p-1.5 rounded-xl bg-[#0D1117]/95 border border-slate-700/80 shadow-2xl backdrop-blur-md select-none w-32 sm:w-36 transition-all"
      >
        {/* Section 1: Navigation Actions (Focus & Fit All) */}
        <div className="flex flex-col gap-1 p-0.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <button
            type="button"
            onClick={handleResetZoom}
            className="w-full px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-750 text-[11px] font-bold text-slate-200 hover:text-amber-400 flex items-center justify-between transition-all shadow-sm"
            title="Focus on Active Step (85%)"
          >
            <span className="flex items-center gap-1.5">
              <Navigation className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Focus</span>
            </span>
            <span className="text-[9px] text-slate-500 font-mono">85%</span>
          </button>

          <button
            type="button"
            onClick={handleFitRoadmap}
            className="w-full px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-750 text-[11px] font-bold text-slate-200 hover:text-cyan-300 flex items-center justify-between transition-all shadow-sm"
            title="Fit Full Roadmap on Screen"
          >
            <span className="flex items-center gap-1.5">
              <Maximize2 className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>Fit All</span>
            </span>
            <span className="text-[9px] text-slate-500 font-mono">Auto</span>
          </button>
        </div>

        {/* Section 2: Step Expansion Controls */}
        <div className="flex flex-col gap-1 p-0.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <button
            type="button"
            onClick={handleExpandAll}
            className="w-full px-2 py-1 rounded-md text-[11px] font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 flex items-center justify-between transition-all shadow-sm"
            title="Expand all 19 steps simultaneously"
          >
            <span className="flex items-center gap-1.5">
              <Expand className="w-3 h-3 shrink-0" />
              <span>Expand All</span>
            </span>
            <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-300">19</span>
          </button>

          <button
            type="button"
            onClick={handleCollapseAll}
            className="w-full px-2 py-1 rounded-md text-[11px] font-bold text-slate-300 bg-slate-900 hover:bg-slate-850 border border-slate-750 flex items-center justify-between transition-all shadow-sm"
            title="Collapse all steps to compact overview mode"
          >
            <span className="flex items-center gap-1.5">
              <Shrink className="w-3 h-3 shrink-0" />
              <span>Collapse All</span>
            </span>
          </button>
        </div>

        {/* Section 3: Zoom Controls (+, %, -) */}
        <div className="flex items-center justify-between gap-1 p-0.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-7 h-7 rounded-md bg-slate-900 hover:bg-slate-850 active:scale-95 border border-slate-750 text-slate-200 hover:text-white flex items-center justify-center transition-all shadow-sm shrink-0"
            title="Zoom Out (-)"
          >
            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          <div className="flex-1 py-0.5 rounded-md text-[10px] font-mono font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 flex items-center justify-center whitespace-nowrap">
            {Math.round(transform.scale * 100)}%
          </div>

          <button
            type="button"
            onClick={handleZoomIn}
            className="w-7 h-7 rounded-md bg-slate-900 hover:bg-slate-850 active:scale-95 border border-slate-750 text-slate-200 hover:text-white flex items-center justify-center transition-all shadow-sm shrink-0"
            title="Zoom In (+)"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ZOOMABLE / DRAGGABLE ROADMAP CANVAS */}
      {/* ======================================================== */}
      <div
        className="absolute top-0 left-0 origin-top-left canvas-smooth-layer"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          width: `${layout.width}px`,
          height: `${layout.height}px`
        }}
      >
        {/* ======================================================== */}
        {/* HIGH PERFORMANCE CONNECTING LINE BETWEEN TWO TOPICS */}
        {/* ======================================================== */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            {/* Primary Energy Gradient */}
            <linearGradient id="pipelineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="35%" stopColor="#06B6D4" />
              <stop offset="70%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>

            {/* Pipeline Arrow Head */}
            <marker
              id="pipelineArrow"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#06B6D4" />
            </marker>
          </defs>

          {/* Sequential Dynamic Connectors between consecutive topics */}
          {layout.nodes.map((node, i) => {
            if (i === layout.nodes.length - 1) return null;
            const nextNode = layout.nodes[i + 1];

            const isTB = direction === 'TB';
            // Start from output terminal of node i, land on input terminal of node i+1
            const startX = isTB ? node.x : node.x + (node.width / 2);
            const startY = isTB ? node.y + (node.height / 2) : node.y;
            const endX = isTB ? nextNode.x : nextNode.x - (nextNode.width / 2);
            const endY = isTB ? nextNode.y - (nextNode.height / 2) : nextNode.y;

            const curveFactor = isTB ? Math.max((endY - startY) / 2, 40) : Math.max((endX - startX) / 2, 40);
            const c1x = isTB ? startX : startX + curveFactor;
            const c1y = isTB ? startY + curveFactor : startY;
            const c2x = isTB ? endX : endX - curveFactor;
            const c2y = isTB ? endY - curveFactor : endY;

            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            const pathString = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;

            return (
              <g key={`pipeline-layer-${node.id}-${nextNode.id}`} className="pipeline-connector-group">
                {/* 1. Broad soft aura conduit */}
                <path
                  d={pathString}
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="10"
                  strokeOpacity="0.2"
                />

                {/* 2. Vibrant solid backbone conduit */}
                <path
                  d={pathString}
                  fill="none"
                  stroke="url(#pipelineGradient)"
                  strokeWidth="4"
                  strokeOpacity="0.85"
                />

                {/* 3. Fast GPU-accelerated animated dashed pulse line */}
                <path
                  d={pathString}
                  fill="none"
                  stroke="#FDE68A"
                  strokeWidth="2.5"
                  className="pipeline-dash-flow"
                  markerEnd="url(#pipelineArrow)"
                />

                {/* 4. Terminal Anchor Points */}
                <circle cx={startX} cy={startY} r="5" fill="#F59E0B" />
                <circle cx={endX} cy={endY} r="5" fill="#06B6D4" />

                {/* 5. Central Progression Milestone Badge */}
                <g 
                  transform={`translate(${midX}, ${midY})`}
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => {
                    onSelectTopic(nextNode.topic.id);
                  }}
                >
                  <rect
                    x="-68"
                    y="-15"
                    width="136"
                    height="30"
                    rx="15"
                    fill="#0D1117"
                    stroke="#F59E0B"
                    strokeWidth="1.8"
                    className="hover:stroke-cyan-400 transition-colors shadow-lg"
                  />
                  <text
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fill="#FDE68A"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="900"
                    letterSpacing="0.6"
                  >
                    STEP {node.topic.stepNumber} → {nextNode.topic.stepNumber}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Roadmap Topics Rendered with Dynamic Dagre Positions */}
        {layout.nodes.map((node) => (
          <div
            key={node.id}
            className="absolute transition-transform duration-200 ease-out"
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
              transform: 'translate(-50%, -50%)',
              width: `${node.width}px`
            }}
          >
            <StepNode
              topic={node.topic}
              isSelected={currentTopicId === node.topicId}
              isExpanded={node.isExpanded}
              onSelect={(topicId) => {
                onSelectTopic(topicId);
              }}
              onToggleExpand={handleToggleExpand}
              onOpenDashboard={onOpenDashboard}
              savedResources={savedResources}
              onToggleSave={onToggleSave}
              onEditResource={onEditResource}
              onDeleteResource={onDeleteResource}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
