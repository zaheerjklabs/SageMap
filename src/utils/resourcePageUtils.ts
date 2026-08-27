import { ResourceItem, RoadmapTopic } from '../types';

export interface DerivedResourceDetails {
  categoryLabel: string;
  categoryTag: string;
  badgeColor: {
    bg: string;
    text: string;
    border: string;
    badgeGlow: string;
  };
  difficulty: string;
  statsHighlight: string;
  ctaText: string;
  accessBadge: string;
  accessNote: string;
  whatYouWillLearn: string[];
  prerequisitesList: string[];
  techBadges: string[];
  curriculum: {
    title: string;
    duration?: string;
    description: string;
    topics: string[];
  }[];
  architectureHighlights: string[];
}

/**
 * Returns a URL-friendly slug for a resource
 */
export function getResourceSlug(resource: ResourceItem): string {
  const baseSlug = resource.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return `${resource.id}-${baseSlug}`;
}

/**
 * Parses resource ID from slug or hash
 */
export function parseResourceIdFromHash(hash: string): string | null {
  const cleanHash = hash.replace(/^#\/?/, '');
  if (cleanHash.startsWith('resource/')) {
    const segment = cleanHash.replace(/^resource\//, '');
    const parts = segment.split('-');
    if (
      segment.startsWith('yt-') ||
      segment.startsWith('gh-') ||
      segment.startsWith('cr-') ||
      segment.startsWith('pj-') ||
      segment.startsWith('doc-') ||
      segment.startsWith('pp-') ||
      segment.startsWith('bk-') ||
      segment.startsWith('art-') ||
      segment.startsWith('custom-')
    ) {
      const match = segment.match(/^([a-z]+-[0-9]+-[0-9]+|[a-z]+-[0-9]+|[a-z0-9_-]+)/);
      if (match) return match[1];
    }
    return parts[0];
  }
  return null;
}

/**
 * Determines color styling tokens based on topic category or resource type
 */
export function getResourceBadgeStyles(categoryOrType: string) {
  const norm = categoryOrType.toLowerCase();
  if (norm.includes('agent') || norm.includes('agentic')) {
    return {
      bg: 'bg-amber-500/15',
      text: 'text-amber-300',
      border: 'border-amber-500/40',
      badgeGlow: 'shadow-amber-500/20'
    };
  }
  if (norm.includes('deep') || norm.includes('genai') || norm.includes('llm')) {
    return {
      bg: 'bg-purple-500/15',
      text: 'text-purple-300',
      border: 'border-purple-500/40',
      badgeGlow: 'shadow-purple-500/20'
    };
  }
  if (norm.includes('data') || norm.includes('ml')) {
    return {
      bg: 'bg-cyan-500/15',
      text: 'text-cyan-300',
      border: 'border-cyan-500/40',
      badgeGlow: 'shadow-cyan-500/20'
    };
  }
  if (norm.includes('mlops') || norm.includes('cloud')) {
    return {
      bg: 'bg-rose-500/15',
      text: 'text-rose-300',
      border: 'border-rose-500/40',
      badgeGlow: 'shadow-rose-500/20'
    };
  }
  if (norm.includes('foundations') || norm.includes('python') || norm.includes('math')) {
    return {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-300',
      border: 'border-emerald-500/40',
      badgeGlow: 'shadow-emerald-500/20'
    };
  }
  return {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
    badgeGlow: 'shadow-amber-500/20'
  };
}

/**
 * Derives rich, structured presentation details for ANY resource item
 */
export function deriveResourceDetails(
  resource: ResourceItem,
  parentTopic?: RoadmapTopic | null
): DerivedResourceDetails {
  const categoryTag = parentTopic?.categoryLabel?.toUpperCase() || 
    (resource.type === 'project' ? 'AGENTIC AI & ML' : 'AI & MACHINE LEARNING');

  const badgeStyles = getResourceBadgeStyles(categoryTag);

  // Stats highlight string
  let statsHighlight = 'Complete Guide';
  if (resource.duration) {
    statsHighlight = resource.duration;
  } else if (resource.type === 'youtube') {
    statsHighlight = resource.videoType ? `${resource.videoType} • Video` : 'Video Lecture';
  } else if (resource.type === 'github' && resource.stars) {
    statsHighlight = `${resource.stars} GitHub Stars`;
  } else if (resource.type === 'course') {
    statsHighlight = resource.rating ? `⭐ ${resource.rating} Rating • Course` : 'Verified Course';
  } else if (resource.type === 'project') {
    statsHighlight = resource.projectTier ? `${resource.projectTier} Project` : 'Practical Project';
  } else if (resource.type === 'paper') {
    statsHighlight = resource.venue ? `${resource.venue} Research Paper` : 'Academic Paper';
  } else if (resource.readTime) {
    statsHighlight = `${resource.readTime} Read`;
  }

  // CTA Text
  let ctaText = 'Open Resource ↗';
  if (resource.type === 'project') {
    ctaText = 'Start Project ↗';
  } else if (resource.type === 'youtube') {
    ctaText = 'Watch on YouTube ↗';
  } else if (resource.type === 'github') {
    ctaText = 'Explore GitHub Repo ↗';
  } else if (resource.type === 'course') {
    ctaText = 'Start Course ↗';
  } else if (resource.type === 'paper') {
    ctaText = 'Read Research Paper ↗';
  } else if (resource.type === 'book') {
    ctaText = 'Read Textbook ↗';
  } else if (resource.type === 'documentation') {
    ctaText = 'Explore Documentation ↗';
  }

  // Access Tier Badge
  let accessBadge = 'Free & Open Source';
  let accessNote = 'Curated AI Resource. Complete Access.';
  if (resource.type === 'project') {
    accessBadge = resource.projectTier ? `${resource.projectTier} Tier Project` : 'Hands-on Pro Project';
    accessNote = 'One Roadmap. 100+ Projects. Unlimited Access.';
  } else if (resource.type === 'course') {
    accessBadge = resource.platform ? `${resource.platform} Specialization` : 'Premium Masterclass';
    accessNote = 'Industry-standard structured curriculum with verified certificates.';
  } else if (resource.type === 'github') {
    accessBadge = 'Open Source Repository';
    accessNote = 'Free access to source code, datasets, benchmarks, and issue discussions.';
  } else if (resource.type === 'paper') {
    accessBadge = 'Open Access Publication';
    accessNote = 'Peer-reviewed research and seminal machine learning advancements.';
  }

  // Technologies / Tags
  const techBadges = Array.from(
    new Set([
      ...(resource.technologies || []),
      ...(resource.skillsLearned || [])
    ])
  ).filter(Boolean);

  if (techBadges.length === 0) {
    techBadges.push('Python', 'AI/ML', 'PyTorch', 'Data Structures');
  }

  // What You Will Learn (2-column checkmarks matching Krish Naik's style)
  let whatYouWillLearn = resource.learningOutcomes || [];
  if (whatYouWillLearn.length === 0) {
    if (resource.skillsLearned && resource.skillsLearned.length > 0) {
      whatYouWillLearn = resource.skillsLearned.map(skill => `Mastering ${skill} and applying best practices`);
    } else {
      const titleClean = resource.title.replace(/[^\w\s-]/g, '').trim();
      whatYouWillLearn = [
        `Mastering the foundational principles and hands-on architecture of ${titleClean}.`,
        `Implementing production-grade code pipelines using ${techBadges.slice(0, 3).join(', ')}.`,
        `Understanding key design patterns, performance optimizations, and debugging strategies.`,
        `Integrating real-world data, APIs, and automated evaluation metrics.`,
        `Deploying and scaling the solution with robust observability and test coverage.`,
        `Structuring end-to-end workflows ready for high-impact technical portfolio showcases.`
      ];
    }
  }

  if (whatYouWillLearn.length < 4) {
    whatYouWillLearn.push(
      `Troubleshooting common failure modes and benchmarking throughput.`,
      `Hands-on practical implementation with source code walkthroughs.`
    );
  }

  // Prerequisites
  let prerequisitesList = resource.prerequisites || [];
  if (prerequisitesList.length === 0) {
    const diff = resource.difficulty || 'Intermediate';
    if (diff === 'Beginner') {
      prerequisitesList = [
        'Basic familiarity with programming logic and command-line terminal.',
        'Python syntax fundamentals (variables, loops, functions).',
        'Curiosity to explore AI and machine learning tools.'
      ];
    } else if (diff.includes('Advanced')) {
      prerequisitesList = [
        'Solid proficiency with Python, OOP, and asynchronous programming.',
        'Strong grasp of deep learning architectures, gradients, and tensor math.',
        'Experience with Docker, API design, and distributed systems.'
      ];
    } else {
      prerequisitesList = [
        'Intermediate Python programming (functions, classes, error handling).',
        'Foundational understanding of machine learning or data structures.',
        'A working Python 3.10+ development environment with Git.'
      ];
    }
  }

  // Curriculum Modules
  let curriculum: {
    title: string;
    duration?: string;
    description: string;
    topics: string[];
  }[] = [];

  if (resource.curriculumModules && resource.curriculumModules.length > 0) {
    curriculum = resource.curriculumModules.map((mod) => ({
      title: mod.title,
      duration: mod.duration,
      description: mod.description || `Comprehensive module covering ${mod.title}.`,
      topics: mod.topics || ['Foundational Setup', 'Core Pipeline Execution', 'Evaluation & Metrics']
    }));
  } else {
    curriculum = [
      {
        title: 'Module 01: System Overview & Foundations',
        duration: '2 Hours',
        description: `Introduction to the core mechanics, motivation, and conceptual groundwork of ${resource.title}.`,
        topics: ['Environment Setup & Dependencies', 'Theoretical Architecture & Mental Models', 'Initial Project Scaffolding']
      },
      {
        title: 'Module 02: Core Implementation & Deep Dive',
        duration: '4 Hours',
        description: `Hands-on coding of the fundamental algorithms, data schemas, and pipeline components.`,
        topics: ['Building the Core Processing Pipeline', 'State Management & Validation Schemas', 'Handling Edge Cases & Async Tasks']
      },
      {
        title: 'Module 03: Integration & Advanced Workflows',
        duration: '3.5 Hours',
        description: `Connecting external APIs, multi-model orchestrations, and interactive interfaces.`,
        topics: ['External API & Tool Calling Integrations', 'Multi-Agent / Vector Database Orchestration', 'Unit Testing & Benchmarks']
      },
      {
        title: 'Module 04: Production Deployment & Best Practices',
        duration: '2.5 Hours',
        description: `Packaging, containerizing, and publishing the final project for real-world usage.`,
        topics: ['Dockerization & Container Optimization', 'CI/CD Pipeline Setup', 'Portfolio Showcase & Documentation']
      }
    ];
  }

  const architectureHighlights = resource.keyHighlights || [
    'Modular decoupled architecture separating ingestion, processing, and output layers.',
    'Strict type validation and schema definitions for maximum runtime reliability.',
    'Scalable asynchronous execution designed to handle high-concurrency workloads.',
    'Fully open-source reference code with step-by-step documentation.'
  ];

  return {
    categoryLabel: parentTopic?.categoryLabel || 'AI Engineering Roadmap',
    categoryTag,
    badgeColor: badgeStyles,
    difficulty: resource.difficulty || 'Intermediate',
    statsHighlight,
    ctaText,
    accessBadge,
    accessNote,
    whatYouWillLearn,
    prerequisitesList,
    techBadges,
    curriculum,
    architectureHighlights
  };
}
