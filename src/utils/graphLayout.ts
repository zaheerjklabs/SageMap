import dagre from '@dagrejs/dagre';
import { RoadmapTopic } from '../types';

export interface LayoutNode {
  id: string;
  topicId: number;
  width: number;
  height: number;
  x: number;
  y: number;
  topic: RoadmapTopic;
  isExpanded: boolean;
}

export interface LayoutEdge {
  id: string;
  sourceId: string;
  targetId: string;
  points: Array<{ x: number; y: number }>;
}

export interface GraphLayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

export interface LayoutOptions {
  direction?: 'TB' | 'LR';
  ranksep?: number;
  nodesep?: number;
  accordionMode?: boolean;
  activeTopicId?: number;
  expandedTopicIds?: Set<number>;
}

/**
 * Calculates the exact dynamic bounding box dimensions of a topic node
 * based on whether it is expanded and how many resource categories are rendered.
 */
export function calculateTopicDimensions(
  topic: RoadmapTopic,
  isExpanded: boolean,
  isDirectionLR: boolean = false
): { width: number; height: number } {
  const baseCardWidth = 480;
  const baseCardHeight = 240;

  if (!isExpanded) {
    return { width: baseCardWidth, height: baseCardHeight };
  }

  // Count active categories
  const categories = [
    topic.resources.filter(r => r.type === 'youtube').length > 0,
    topic.resources.filter(r => r.type === 'github').length > 0,
    topic.resources.filter(r => r.type === 'course').length > 0,
    topic.resources.filter(r => r.type === 'project').length > 0,
    topic.resources.filter(r => r.type === 'documentation').length > 0,
    topic.resources.filter(r => r.type === 'paper').length > 0,
    topic.resources.filter(r => r.type === 'book').length > 0,
  ].filter(Boolean).length;

  if (categories === 0) {
    return { width: baseCardWidth, height: baseCardHeight };
  }

  // Width expands to accommodate category cards grid (up to 1080px)
  let childWidth = 480;
  let childHeight = 440;

  if (categories <= 2) {
    childWidth = Math.max(480, categories * 340);
    childHeight = 440;
  } else if (categories <= 4) {
    childWidth = Math.min(1080, Math.max(720, categories * 330));
    childHeight = 540;
  } else if (categories <= 6) {
    childWidth = 1080;
    childHeight = 880;
  } else {
    childWidth = 1080;
    childHeight = 1200;
  }

  const totalWidth = Math.max(baseCardWidth, childWidth);
  const totalHeight = baseCardHeight + 40 + childHeight; // 40px gap & connection stem

  return { width: totalWidth, height: totalHeight };
}

/**
 * Computes dynamic graph layout using Dagre directed graph layout algorithm.
 */
export function computeGraphLayout(
  topics: RoadmapTopic[],
  options: LayoutOptions = {}
): GraphLayoutResult {
  const {
    direction = 'TB',
    ranksep = 240,
    nodesep = 140,
    expandedTopicIds = new Set<number>([1])
  } = options;

  const isLR = direction === 'LR';

  // Instantiate Dagre graph
  const g = new dagre.graphlib.Graph({ multigraph: false, compound: false });
  
  g.setGraph({
    rankdir: direction,
    ranksep: ranksep,
    nodesep: nodesep,
    align: 'DL',
    marginx: 100,
    marginy: 100,
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes with calculated dynamic dimensions
  topics.forEach((topic) => {
    const isExpanded = expandedTopicIds.has(topic.id);
    const { width, height } = calculateTopicDimensions(topic, isExpanded, isLR);

    g.setNode(topic.id.toString(), {
      width,
      height,
      topic,
      isExpanded
    });
  });

  // Add sequential edges connecting each topic step in exact order
  for (let i = 0; i < topics.length - 1; i++) {
    const currentId = topics[i].id.toString();
    const nextId = topics[i + 1].id.toString();
    g.setEdge(currentId, nextId);
  }

  // Execute Dagre layout algorithm
  dagre.layout(g);

  // Extract layout nodes
  const layoutNodes: LayoutNode[] = [];
  topics.forEach((topic) => {
    const nodeId = topic.id.toString();
    const dagreNode = g.node(nodeId);
    if (dagreNode) {
      const isExpanded = expandedTopicIds.has(topic.id);

      layoutNodes.push({
        id: nodeId,
        topicId: topic.id,
        x: dagreNode.x,
        y: dagreNode.y,
        width: dagreNode.width,
        height: dagreNode.height,
        topic,
        isExpanded
      });
    }
  });

  // Extract edge paths
  const layoutEdges: LayoutEdge[] = [];
  for (let i = 0; i < topics.length - 1; i++) {
    const sourceId = topics[i].id.toString();
    const targetId = topics[i + 1].id.toString();
    const dagreEdge = g.edge(sourceId, targetId);
    
    if (dagreEdge && dagreEdge.points) {
      layoutEdges.push({
        id: `edge-${sourceId}-${targetId}`,
        sourceId,
        targetId,
        points: dagreEdge.points
      });
    }
  }

  // Determine overall graph bounding box
  const graphInfo = g.graph();
  const graphWidth = (graphInfo?.width || 2400) + 300;
  const graphHeight = (graphInfo?.height || 5000) + 400;

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    width: Math.max(graphWidth, 2400),
    height: Math.max(graphHeight, 2400)
  };
}
