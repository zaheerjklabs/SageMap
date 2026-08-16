import React, { useState, useEffect, useMemo } from 'react';
import { ROADMAP_TOPICS } from './data/roadmapData';
import { ViewMode, UserCollections, ResourceItem } from './types';
import { 
  loadCollectionsFromStorage, 
  saveCollectionsToStorage, 
  getThemeFromStorage, 
  saveThemeToStorage 
} from './utils/storage';
import { resolveAllTopics, resolveTopicResources } from './utils/resourceUtils';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { CanvasView } from './components/CanvasView';
import { CurriculumMatrixView } from './components/CurriculumMatrixView';
import { ResourceExplorerView } from './components/ResourceExplorerView';
import { TopicDashboard } from './components/TopicDashboard';
import { ResourceModal } from './components/ResourceModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getThemeFromStorage());
  const [currentTopicId, setCurrentTopicId] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [dashboardTopicId, setDashboardTopicId] = useState<number | null>(null);

  // Modal states for creating, editing, and deleting resources
  const [isResourceModalOpen, setIsResourceModalOpen] = useState<boolean>(false);
  const [resourceModalTopicId, setResourceModalTopicId] = useState<number>(1);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  
  const [deletingResource, setDeletingResource] = useState<ResourceItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // User persistent collections (bookmarks, custom resources, edits, deletions, notes)
  const [collections, setCollections] = useState<UserCollections>(() => loadCollectionsFromStorage());

  // Save collections changes to storage
  useEffect(() => {
    saveCollectionsToStorage(collections);
  }, [collections]);

  // Sync theme
  useEffect(() => {
    saveThemeToStorage(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Resolved dynamic roadmap topics (with custom additions, overrides, and deletions applied)
  const resolvedTopics = useMemo(() => {
    return resolveAllTopics(ROADMAP_TOPICS, collections);
  }, [collections]);

  // Toggle bookmark / saved resource
  const handleToggleSaveResource = (resourceId: string) => {
    setCollections(prev => {
      const nextSaved = !prev.savedResources[resourceId];
      return {
        ...prev,
        savedResources: {
          ...prev.savedResources,
          [resourceId]: nextSaved
        }
      };
    });
  };

  // Add or Edit resource handler
  const handleSaveResource = (resource: ResourceItem, isEdit: boolean) => {
    setCollections(prev => {
      if (isEdit) {
        const isCustom = resource.isCustom;
        const updatedCustom = isCustom
          ? prev.customResources.map(r => r.id === resource.id ? { ...resource, isCustom: true } : r)
          : prev.customResources;

        return {
          ...prev,
          customResources: updatedCustom,
          editedResources: {
            ...prev.editedResources,
            [resource.id]: resource
          },
          deletedResourceIds: {
            ...prev.deletedResourceIds,
            [resource.id]: false
          }
        };
      } else {
        return {
          ...prev,
          customResources: [resource, ...prev.customResources]
        };
      }
    });
  };

  // Open Edit modal
  const handleOpenEditResourceModal = (resource: ResourceItem) => {
    setEditingResource(resource);
    setResourceModalTopicId(resource.topicId);
    setIsResourceModalOpen(true);
  };

  // Open Add modal
  const handleOpenAddResourceModal = (topicId?: number) => {
    setEditingResource(null);
    setResourceModalTopicId(topicId || currentTopicId);
    setIsResourceModalOpen(true);
  };

  // Open Delete confirmation
  const handleOpenDeleteModal = (resource: ResourceItem) => {
    setDeletingResource(resource);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete resource
  const handleConfirmDelete = (resourceId: string) => {
    setCollections(prev => ({
      ...prev,
      deletedResourceIds: {
        ...prev.deletedResourceIds,
        [resourceId]: true
      },
      customResources: prev.customResources.filter(r => r.id !== resourceId),
      savedResources: {
        ...prev.savedResources,
        [resourceId]: false
      }
    }));
    setDeletingResource(null);
    setIsDeleteModalOpen(false);
  };



  // Save topic personal study notes
  const handleSaveNote = (topicId: number, note: string) => {
    setCollections(prev => ({
      ...prev,
      topicNotes: {
        ...prev.topicNotes,
        [topicId]: note
      }
    }));
  };

  // Topic selection handler
  const handleSelectTopic = (topicId: number) => {
    setCurrentTopicId(topicId);
    setCollections(prev => ({ ...prev, lastVisitedTopicId: topicId }));
  };

  // Open Topic Dashboard
  const handleOpenTopicDashboard = (topicId: number) => {
    setDashboardTopicId(topicId);
    setCurrentTopicId(topicId);
  };

  const activeDashboardTopic = useMemo(() => {
    if (!dashboardTopicId) return null;
    const baseTopic = ROADMAP_TOPICS.find(t => t.id === dashboardTopicId);
    if (!baseTopic) return null;
    return resolveTopicResources(baseTopic, collections);
  }, [dashboardTopicId, collections]);

  const savedCount = Object.keys(collections.savedResources).filter(k => collections.savedResources[k]).length;
  const deletedCount = Object.keys(collections.deletedResourceIds).filter(k => collections.deletedResourceIds[k]).length;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#090A0F] text-slate-100' : 'bg-slate-900 text-slate-100'
    }`}>
      {/* Top Bar Navigation */}
      <TopBar
        currentTopicId={currentTopicId}
        onSelectTopic={handleSelectTopic}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        savedResourcesCount={savedCount}
        onAddResourceClick={() => handleOpenAddResourceModal(currentTopicId)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Topics Sidebar */}
        <Sidebar
          currentTopicId={currentTopicId}
          onSelectTopic={handleSelectTopic}
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen(prev => !prev)}
          onOpenTopicDashboard={handleOpenTopicDashboard}
        />

        {/* Viewport content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {viewMode === 'canvas' && (
            <CanvasView
              topics={resolvedTopics}
              currentTopicId={currentTopicId}
              onSelectTopic={handleSelectTopic}
              onOpenDashboard={handleOpenTopicDashboard}
              savedResources={collections.savedResources}
              onToggleSave={handleToggleSaveResource}
              onEditResource={handleOpenEditResourceModal}
              onDeleteResource={handleOpenDeleteModal}
            />
          )}

          {viewMode === 'matrix' && (
            <CurriculumMatrixView
              topics={resolvedTopics}
              onOpenTopicDashboard={handleOpenTopicDashboard}
              savedResources={collections.savedResources}
              onToggleSave={handleToggleSaveResource}
            />
          )}

          {viewMode === 'explorer' && (
            <ResourceExplorerView
              topics={resolvedTopics}
              savedResources={collections.savedResources}
              onToggleSave={handleToggleSaveResource}
              onSelectTopic={handleSelectTopic}
              onAddResourceClick={() => handleOpenAddResourceModal(currentTopicId)}
              onEditResource={handleOpenEditResourceModal}
              onDeleteResource={handleOpenDeleteModal}
              deletedCount={deletedCount}
            />
          )}
        </main>
      </div>

      {/* Dedicated Topic Learning Dashboard Slide-over */}
      <TopicDashboard
        topic={activeDashboardTopic}
        isOpen={dashboardTopicId !== null}
        onClose={() => setDashboardTopicId(null)}
        savedResources={collections.savedResources}
        onToggleSave={handleToggleSaveResource}
        onEditResource={handleOpenEditResourceModal}
        onDeleteResource={handleOpenDeleteModal}
        topicNote={dashboardTopicId ? collections.topicNotes[dashboardTopicId] || '' : ''}
        onSaveNote={handleSaveNote}
        onSelectTopic={handleSelectTopic}
        onAddCustomResourceClick={handleOpenAddResourceModal}
      />

      {/* Unified Add & Edit Resource Modal */}
      <ResourceModal
        isOpen={isResourceModalOpen}
        onClose={() => {
          setIsResourceModalOpen(false);
          setEditingResource(null);
        }}
        onSaveResource={handleSaveResource}
        initialTopicId={resourceModalTopicId}
        editingResource={editingResource}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        resource={deletingResource}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingResource(null);
        }}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
