import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ROADMAP_TOPICS } from './data/roadmapData';
import { ViewMode, UserCollections, ResourceItem } from './types';
import { 
  loadCollectionsFromStorage, 
  saveCollectionsToStorage, 
  getThemeFromStorage, 
  saveThemeToStorage 
} from './utils/storage';
import { mergeTopicsWithDbResources } from './utils/resourceUtils';
import {
  fetchAllResources,
  upsertResource,
  deleteResource,
  seedResourcesIfEmpty,
  pushWebsiteStateToSupabase,
  subscribeToResourceChanges
} from './services/resourceService';
import { useAuth } from './contexts/AuthContext';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { CanvasView } from './components/CanvasView';
import { CurriculumMatrixView } from './components/CurriculumMatrixView';
import { ResourceExplorerView } from './components/ResourceExplorerView';
import { TopicDashboard } from './components/TopicDashboard';
import { ResourceModal } from './components/ResourceModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const { isAdmin, isLoading: authLoading, signIn, signUp, signOut, user } = useAuth();

  const [theme, setTheme] = useState<'dark' | 'light'>(() => getThemeFromStorage());
  const [currentTopicId, setCurrentTopicId] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [dashboardTopicId, setDashboardTopicId] = useState<number | null>(null);

  const [isResourceModalOpen, setIsResourceModalOpen] = useState<boolean>(false);
  const [resourceModalTopicId, setResourceModalTopicId] = useState<number>(1);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  
  const [deletingResource, setDeletingResource] = useState<ResourceItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [dbResources, setDbResources] = useState<ResourceItem[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [collections, setCollections] = useState<UserCollections>(() => loadCollectionsFromStorage());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const refreshResources = useCallback(async () => {
    const resources = await fetchAllResources();
    setDbResources(resources);
    return resources;
  }, []);

  // Fetch initial resources from Supabase on mount
  useEffect(() => {
    refreshResources().finally(() => setResourcesLoading(false));
  }, [refreshResources]);

  // Subscribe to real-time updates from Supabase so all users see changes immediately
  useEffect(() => {
    const unsubscribe = subscribeToResourceChanges(({ eventType, resource, oldId }) => {
      if (eventType === 'DELETE' && oldId) {
        setDbResources((prev) => prev.filter((r) => r.id !== oldId));
      } else if (resource) {
        setDbResources((prev) => {
          const exists = prev.some((r) => r.id === resource.id);
          if (exists) {
            return prev.map((r) => (r.id === resource.id ? resource : r));
          }
          return [resource, ...prev];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-seed if Supabase is completely empty and admin is signed in
  useEffect(() => {
    if (!isAdmin) return;

    const allStaticResources = ROADMAP_TOPICS.flatMap((topic) => topic.resources);
    seedResourcesIfEmpty(allStaticResources).then((seeded) => {
      if (seeded) {
        refreshResources();
      }
    });
  }, [isAdmin, refreshResources]);

  useEffect(() => {
    saveCollectionsToStorage(collections);
  }, [collections]);

  useEffect(() => {
    saveThemeToStorage(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const resolvedTopics = useMemo(() => {
    return mergeTopicsWithDbResources(ROADMAP_TOPICS, dbResources);
  }, [dbResources]);

  const handleToggleSaveResource = (resourceId: string) => {
    setCollections((prev) => {
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

  const handleSaveResource = async (resource: ResourceItem, isEdit: boolean) => {
    if (!isAdmin) return;

    // Optimistic state update
    setDbResources((prev) => {
      const exists = prev.some((r) => r.id === resource.id);
      if (exists) {
        return prev.map((r) => (r.id === resource.id ? { ...resource, isEdited: true } : r));
      }
      return [{ ...resource, isEdited: true }, ...prev];
    });

    try {
      const saved = await upsertResource(resource);
      if (saved) {
        setDbResources((prev) => {
          const exists = prev.some((r) => r.id === saved.id);
          if (exists) {
            return prev.map((r) => (r.id === saved.id ? saved : r));
          }
          return [saved, ...prev];
        });
        showToast(isEdit ? 'Resource updated permanently in Supabase!' : 'Resource added permanently to Supabase!');
      }
    } catch (err) {
      console.error('Failed to save resource to Supabase:', err);
      const message = err instanceof Error ? err.message : 'Failed to save resource';
      alert(`Supabase Error: ${message}`);
      refreshResources();
    }
  };

  const handleOpenEditResourceModal = (resource: ResourceItem) => {
    if (!isAdmin) return;
    setEditingResource(resource);
    setResourceModalTopicId(resource.topicId);
    setIsResourceModalOpen(true);
  };

  const handleOpenAddResourceModal = (topicId?: number) => {
    if (!isAdmin) return;
    setEditingResource(null);
    setResourceModalTopicId(topicId || currentTopicId);
    setIsResourceModalOpen(true);
  };

  const handleOpenDeleteModal = (resource: ResourceItem) => {
    if (!isAdmin) return;
    setDeletingResource(resource);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (resourceId: string) => {
    if (!isAdmin) return;

    const targetTopicId = deletingResource?.topicId || currentTopicId;

    // Optimistic deletion
    setDbResources((prev) => prev.filter((r) => r.id !== resourceId));
    setCollections((prev) => ({
      ...prev,
      savedResources: {
        ...prev.savedResources,
        [resourceId]: false
      }
    }));

    try {
      await deleteResource(resourceId);
      showToast('Resource deleted permanently from Supabase.');
    } catch (err) {
      console.error('Failed to delete resource in Supabase:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete resource';
      alert(`Supabase Error: ${message}`);
      refreshResources();
    }

    setDeletingResource(null);
    setIsDeleteModalOpen(false);
  };

  const handleSyncAll = async () => {
    if (!isAdmin) return;
    setIsSyncing(true);
    try {
      const currentActiveResources = resolvedTopics.flatMap((t) => t.resources);
      const success = await pushWebsiteStateToSupabase(currentActiveResources);
      if (success) {
        await refreshResources();
        showToast('Website changes synced to Supabase (deletions and edits applied)!');
      } else {
        alert('Could not complete database sync. Check your connection or console.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      alert(`Sync Error: ${message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveNote = (topicId: number, note: string) => {
    setCollections((prev) => ({
      ...prev,
      topicNotes: {
        ...prev.topicNotes,
        [topicId]: note
      }
    }));
  };

  const handleSelectTopic = (topicId: number) => {
    setCurrentTopicId(topicId);
    setCollections((prev) => ({ ...prev, lastVisitedTopicId: topicId }));
  };

  const handleOpenTopicDashboard = (topicId: number) => {
    setDashboardTopicId(topicId);
    setCurrentTopicId(topicId);
  };

  const activeDashboardTopic = useMemo(() => {
    if (!dashboardTopicId) return null;
    return resolvedTopics.find((t) => t.id === dashboardTopicId) ?? null;
  }, [dashboardTopicId, resolvedTopics]);

  const savedCount = Object.keys(collections.savedResources).filter((k) => collections.savedResources[k]).length;

  const adminEditHandler = isAdmin ? handleOpenEditResourceModal : undefined;
  const adminDeleteHandler = isAdmin ? handleOpenDeleteModal : undefined;
  const adminAddHandler = isAdmin ? () => handleOpenAddResourceModal(currentTopicId) : undefined;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#090A0F] text-slate-100' : 'bg-slate-900 text-slate-100'
    }`}>
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
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        savedResourcesCount={savedCount}
        isAdmin={isAdmin}
        userEmail={user?.email}
        onAddResourceClick={() => handleOpenAddResourceModal(currentTopicId)}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={signOut}
        onSyncDb={handleSyncAll}
        isSyncing={isSyncing}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-[#0D1117]/95 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-2xl backdrop-blur-md animate-fadeIn flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          currentTopicId={currentTopicId}
          onSelectTopic={handleSelectTopic}
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
          onOpenTopicDashboard={handleOpenTopicDashboard}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {(resourcesLoading || authLoading) && (
            <div className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-400">
              Loading content...
            </div>
          )}

          {viewMode === 'canvas' && (
            <CanvasView
              topics={resolvedTopics}
              currentTopicId={currentTopicId}
              onSelectTopic={handleSelectTopic}
              onOpenDashboard={handleOpenTopicDashboard}
              savedResources={collections.savedResources}
              onToggleSave={handleToggleSaveResource}
              onEditResource={adminEditHandler}
              onDeleteResource={adminDeleteHandler}
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
              isAdmin={isAdmin}
              onAddResourceClick={adminAddHandler}
              onEditResource={adminEditHandler}
              onDeleteResource={adminDeleteHandler}
            />
          )}
        </main>
      </div>

      <TopicDashboard
        topic={activeDashboardTopic}
        isOpen={dashboardTopicId !== null}
        onClose={() => setDashboardTopicId(null)}
        savedResources={collections.savedResources}
        onToggleSave={handleToggleSaveResource}
        onEditResource={adminEditHandler}
        onDeleteResource={adminDeleteHandler}
        topicNote={dashboardTopicId ? collections.topicNotes[dashboardTopicId] || '' : ''}
        onSaveNote={handleSaveNote}
        onSelectTopic={handleSelectTopic}
        onAddCustomResourceClick={isAdmin ? handleOpenAddResourceModal : undefined}
      />

      {isAdmin && (
        <>
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

          <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            resource={deletingResource}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setDeletingResource(null);
            }}
            onConfirmDelete={handleConfirmDelete}
          />
        </>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSignIn={signIn}
        onSignUp={signUp}
      />
    </div>
  );
}
