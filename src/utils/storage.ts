import { UserCollections } from '../types';

const STORAGE_KEY = 'ai_ml_learning_collections_v3';
const THEME_KEY = 'ai_ml_roadmap_theme_v3';

export const loadCollectionsFromStorage = (): UserCollections => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        savedResources: parsed.savedResources || parsed.bookmarkedResources || {},
        customResources: parsed.customResources || [],
        editedResources: parsed.editedResources || {},
        deletedResourceIds: parsed.deletedResourceIds || {},
        topicNotes: parsed.topicNotes || parsed.stepNotes || {},
        lastVisitedTopicId: parsed.lastVisitedTopicId || 1
      };
    }
  } catch (e) {
    console.error('Failed to load collections from localStorage', e);
  }
  return {
    savedResources: {},
    customResources: [],
    editedResources: {},
    deletedResourceIds: {},
    topicNotes: {},
    lastVisitedTopicId: 1
  };
};

export const saveCollectionsToStorage = (collections: UserCollections) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  } catch (e) {
    console.error('Failed to save collections to localStorage', e);
  }
};

export const getThemeFromStorage = (): 'dark' | 'light' => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch (e) {
    console.error('Failed to load theme', e);
  }
  return 'dark';
};

export const saveThemeToStorage = (theme: 'dark' | 'light') => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.error('Failed to save theme', e);
  }
};
