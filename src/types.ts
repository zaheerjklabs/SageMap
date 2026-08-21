export type ResourceType = 
  | 'youtube'
  | 'github'
  | 'course'
  | 'project'
  | 'documentation'
  | 'paper'
  | 'book'
  | 'article'
  | 'interview'
  | 'tool';

export type DifficultyLevel = 
  | 'Beginner' 
  | 'Intermediate' 
  | 'Advanced' 
  | 'All Levels' 
  | 'Beginner to Intermediate' 
  | 'Intermediate to Advanced';

export type ProjectTier = 'Beginner' | 'Intermediate' | 'Advanced' | 'Real-world' | 'Capstone';

export type StepCategory = 
  | 'foundations' 
  | 'data_ml' 
  | 'deep_genai' 
  | 'agentic_systems' 
  | 'mlops_cloud';

export interface ResourceItem {
  id: string;
  topicId: number;
  type: ResourceType;
  title: string;
  url: string;
  description: string;
  difficulty?: DifficultyLevel;
  technologies: string[];
  isCustom?: boolean;
  isEdited?: boolean;
  
  imageUrl?: string;
  thumbnailUrl?: string;
  
  // YouTube specific
  channelName?: string;
  duration?: string;
  videoType?: 'Full Course' | 'Playlist' | 'Deep Dive' | 'Tutorial' | 'Crash Course';
  
  // GitHub specific
  stars?: string;
  author?: string;
  language?: string;
  forks?: string;
  
  // Course specific
  platform?: 'Coursera' | 'Udemy' | 'DeepLearning.AI' | 'Stanford Online' | 'Fast.ai' | 'FreeCodeCamp' | 'MIT OpenCourseWare' | 'edX';
  instructor?: string;
  rating?: number;
  
  // Project specific
  projectTier?: ProjectTier;
  skillsLearned?: string[];
  demoUrl?: string;
  githubUrl?: string;
  
  // Documentation / Official Reference specific
  siteName?: string;
  docCategory?: 'Official Docs' | 'Interactive Sandbox' | 'Cheat Sheet' | 'Specification' | 'Quickstart';
  
  // Research Paper specific
  authors?: string;
  year?: number | string;
  venue?: 'arXiv' | 'NeurIPS' | 'ICML' | 'ICLR' | 'CVPR' | 'ACL' | 'Nature' | 'Science';
  abstractSummary?: string;
  
  // Book specific
  bookAuthor?: string;
  publisher?: string;
  bookYear?: number | string;
  
  // Article specific
  publication?: string;
  readTime?: string;
}

export interface CoreConcept {
  title: string;
  description: string;
  tag: string;
}

export interface InterviewQnA {
  question: string;
  answerSummary: string;
  difficulty: 'Junior' | 'Mid-Level' | 'Senior' | 'Staff / Principal';
  keyTakeaway: string;
}

export interface ToolFramework {
  name: string;
  category: string;
  description: string;
  url: string;
}

export interface TopicSubtopic {
  id: string;
  title: string;
  description: string;
  skills: string[];
}

export interface RoadmapTopic {
  id: number;
  stepNumber: string; // "01", "02", etc.
  title: string;
  shortSubtitle: string;
  category: StepCategory;
  categoryLabel: string;
  overview: string;
  recommendedOrder: string[];
  coreConcepts: CoreConcept[];
  subtopics: TopicSubtopic[];
  interviewQuestions: InterviewQnA[];
  toolsAndFrameworks: ToolFramework[];
  resources: ResourceItem[];
  accentColor: string; // 'amber' | 'cyan' | 'purple' | 'emerald' | 'rose' | 'indigo' | 'blue'
  glowColor: string;
  borderColor: string;
  position: {
    x: number;
    y: number;
  };
}

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export type ViewMode = 'canvas' | 'matrix' | 'explorer';

export interface UserCollections {
  savedResources: Record<string, boolean>; // resourceId -> true (bookmarked / saved to collection)
  customResources: ResourceItem[]; // user-added resources
  editedResources: Record<string, ResourceItem>; // resourceId -> edited resource overrides
  deletedResourceIds: Record<string, boolean>; // resourceId -> true if deleted
  topicNotes: Record<number, string>; // personal notes for learning topic
  lastVisitedTopicId: number;
}
