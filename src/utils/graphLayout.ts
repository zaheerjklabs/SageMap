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
  const baseCardHeight = 260;

  if (!isExpanded || !topic.resources || topic.resources.length === 0) {
    return { width: baseCardWidth, height: baseCardHeight };
  }

  // Count resources for each category type
  const categoryTypes = [
    'youtube',
    'github',
    'course',
    'project',
    'documentation',
    'paper',
    'book',
    'article'
  ] as const;

  const activeCategoryHeights: number[] = [];

  categoryTypes.forEach((type) => {
    const count = topic.resources.filter((r) => r.type === type).length;
    if (count > 0) {
      // Category node header ~52px + container padding ~16px + resource card list (max 380px)
      const resourceListHeight = Math.min(380, count * 92);
      const categoryNodeHeight = 52 + 16 + resourceListHeight;
      activeCategoryHeights.push(categoryNodeHeight);
    }
  });

  const numCategories = activeCategoryHeights.length;
  if (numCategories === 0) {
    return { width: baseCardWidth, height: baseCardHeight };
  }

  // Width expands based on column layout (320px column + 16px gap, up to 3 columns per row)
  let childWidth = 480;
  if (numCategories === 1) {
    childWidth = 480;
  } else if (numCategories === 2) {
    childWidth = 680;
  } else {
    childWidth = 1080;
  }

  // Calculate row wrapping height (up to 3 columns per row in flex container)
  const colsPerRow = 3;
  const numRows = Math.ceil(numCategories / colsPerRow);
  let childHeight = 0;

  for (let r = 0; r < numRows; r++) {
    const rowCategoryHeights = activeCategoryHeights.slice(r * colsPerRow, (r + 1) * colsPerRow);
    const rowMaxHeight = Math.max(...rowCategoryHeights, 0);
    childHeight += rowMaxHeight;
  }

  // Add gaps between rows (16px between rows)
  if (numRows > 1) {
    childHeight += (numRows - 1) * 16;
  }

  const totalWidth = Math.max(baseCardWidth, childWidth);
  const totalHeight = baseCardHeight + 40 + childHeight; // 40px stem gap

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
