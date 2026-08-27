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
  saveResourceOrder,
  seedResourcesIfEmpty,
  pushWebsiteStateToSupabase,
  subscribeToResourceChanges
} from './services/resourceService';
import { useAuth } from './contexts/AuthContext';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { CanvasView } from './components/CanvasView';
import { ResourceExplorerView } from './components/ResourceExplorerView';
import { TopicDashboard } from './components/TopicDashboard';
import { ResourceDetailPage } from './components/ResourceDetailPage';
import { ResourceModal } from './components/ResourceModal';
import { TopicEditModal } from './components/TopicEditModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { AuthModal } from './components/AuthModal';
import { SageAITutorDrawer } from './components/SageAITutorDrawer';
import { parseResourceIdFromHash } from './utils/resourcePageUtils';
import { Bot } from 'lucide-react';
import { RoadmapTopic as RoadmapTopicType } from './types';

export default function App() {
  const { isAdmin, isLoading: authLoading, signIn, signUp, signOut, user, isPasswordRecovery } = useAuth();

  const [theme, setTheme] = useState<'dark' | 'light'>(() => getThemeFromStorage());
  const [currentTopicId, setCurrentTopicId] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [dashboardTopicId, setDashboardTopicId] = useState<number | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(() => {
    return parseResourceIdFromHash(window.location.hash);
  });

  const [isSageAiOpen, setIsSageAiOpen] = useState<boolean>(false);

  const [isResourceModalOpen, setIsResourceModalOpen] = useState<boolean>(false);
  const [resourceModalTopicId, setResourceModalTopicId] = useState<number>(1);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);

  const [editingTopic, setEditingTopic] = useState<RoadmapTopicType | null>(null);
  const [isTopicEditModalOpen, setIsTopicEditModalOpen] = useState<boolean>(false);
  const [topicOverrides, setTopicOverrides] = useState<Record<number, Partial<RoadmapTopicType>>>(() => {
    try {
      const s = localStorage.getItem('sagemap_topic_overrides');
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  });
  
  const [deletingResource, setDeletingResource] = useState<ResourceItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Automatically open AuthModal if user landed on the page from a password reset email link
  useEffect(() => {
    if (isPasswordRecovery) {
      setIsAuthModalOpen(true);
    }
  }, [isPasswordRecovery]);

  const [dbResources, setDbResources] = useState<ResourceItem[]>([]);
  const [deletedResourceIds, setDeletedResourceIds] = useState<string[]>([]);
  const [isDbInitialized, setIsDbInitialized] = useState<boolean>(false);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [collections, setCollections] = useState<UserCollections>(() => loadCollectionsFromStorage());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const refreshResources = useCallback(async () => {
    const result = await fetchAllResources();
    setDbResources(result.resources);
    setDeletedResourceIds(result.deletedIds);
    setIsDbInitialized(result.isInitialized);
    if (result.resourceOrder && result.resourceOrder.length > 0) {
      setCollections((prev) => {
        const updated = {
          ...prev,
          resourceOrder: result.resourceOrder
        };
        saveCollectionsToStorage(updated);
        return updated;
      });
    }
    if (result.topicOverrides && Object.keys(result.topicOverrides).length > 0) {
      setTopicOverrides((prev) => {
        const merged = { ...result.topicOverrides, ...prev };
        try {
          localStorage.setItem('sagemap_topic_overrides', JSON.stringify(merged));
        } catch (e) {}
        return merged;
      });
    }
    return result;
  }, []);

  // Fetch initial resources from Supabase on mount
  useEffect(() => {
    refreshResources().finally(() => setResourcesLoading(false));
  }, [refreshResources]);

  // Subscribe to real-time updates from Supabase so all users see changes immediately
  useEffect(() => {
    const unsubscribe = subscribeToResourceChanges(({ eventType, resource, oldId, deletedIds, resourceOrder }) => {
      if (eventType === 'DELETE' && oldId) {
        setDbResources((prev) => prev.filter((r) => r.id !== oldId));
        setDeletedResourceIds((prev) => Array.from(new Set([...prev, oldId])));
      } else if (eventType === 'METADATA_UPDATE') {
        if (deletedIds) {
          setDeletedResourceIds(deletedIds);
          setDbResources((prev) => {
            const delSet = new Set(deletedIds);
            return prev.filter((r) => !delSet.has(r.id));
          });
        }
        if (resourceOrder && resourceOrder.length > 0) {
          setCollections((prev) => {
            const updated = {
              ...prev,
              resourceOrder
            };
            saveCollectionsToStorage(updated);
            return updated;
          });
        }
      } else if (resource) {
        setDbResources((prev) => {
          const exists = prev.some((r) => r.id === resource.id);
          if (exists) {
            return prev.map((r) => (r.id === resource.id ? resource : r));
          }
          return [resource, ...prev];
        });
        setDeletedResourceIds((prev) => prev.filter((id) => id !== resource.id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-seed if Supabase is completely uninitialized and admin is signed in
  useEffect(() => {
    if (!isAdmin || isDbInitialized) return;

    const allStaticResources = ROADMAP_TOPICS.flatMap((topic) => topic.resources);
    seedResourcesIfEmpty(allStaticResources).then((seeded) => {
      if (seeded) {
        refreshResources();
      }
    });
  }, [isAdmin, isDbInitialized, refreshResources]);

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

  // URL hash routing listener for deep-linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const resId = parseResourceIdFromHash(hash);
      if (resId) {
        setSelectedResourceId(resId);
        return;
      }
      setSelectedResourceId(null);

      const cleanHash = hash.replace(/^#\/?/, '').toLowerCase();
      if (cleanHash === 'projects') {
        setViewMode('projects');
      } else if (cleanHash === 'courses') {
        setViewMode('courses');
      } else if (cleanHash === 'youtube') {
        setViewMode('youtube');
      } else if (cleanHash === 'github') {
        setViewMode('github');
      } else if (cleanHash === 'papers') {
        setViewMode('papers');
      } else if (cleanHash === 'books') {
        setViewMode('books');
      } else if (cleanHash === 'blogs' || cleanHash === 'articles') {
        setViewMode('blogs');
      } else if (cleanHash === 'explorer' || cleanHash === 'resources') {
        setViewMode('explorer');
      } else if (cleanHash === 'canvas' || cleanHash === 'roadmap') {
        setViewMode('canvas');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const deletedIdSet = useMemo(() => new Set(deletedResourceIds), [deletedResourceIds]);

  const resolvedTopics = useMemo(() => {
    const merged = mergeTopicsWithDbResources(ROADMAP_TOPICS, dbResources, isDbInitialized, deletedIdSet);
    return merged.map((t) => {
      const override = topicOverrides[t.id];
      if (!override) return t;
      return {
        ...t,
        ...override
      };
    });
  }, [dbResources, isDbInitialized, deletedIdSet, topicOverrides]);

  const handleOpenEditTopic = (topic: RoadmapTopicType) => {
    setEditingTopic(topic);
    setIsTopicEditModalOpen(true);
  };

  const handleSaveTopic = (updatedTopic: RoadmapTopicType) => {
    setTopicOverrides((prev) => {
      const next = {
        ...prev,
        [updatedTopic.id]: {
          title: updatedTopic.title,
          shortSubtitle: updatedTopic.shortSubtitle,
          categoryLabel: updatedTopic.categoryLabel,
          overview: updatedTopic.overview,
          stepNumber: updatedTopic.stepNumber,
          recommendedOrder: updatedTopic.recommendedOrder,
          coreConcepts: updatedTopic.coreConcepts,
          subtopics: updatedTopic.subtopics,
          toolsAndFrameworks: updatedTopic.toolsAndFrameworks
        }
      };
      try {
        localStorage.setItem('sagemap_topic_overrides', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save topic overrides', err);
      }
      return next;
    });
    showToast(`Saved curriculum changes for Step ${updatedTopic.stepNumber}!`);
  };

  // Look up selected resource for dedicated Krish Naik style detail page
  const selectedResourceData = useMemo(() => {
    if (!selectedResourceId) return null;
    for (const t of resolvedTopics) {
      const found = t.resources.find((r) => r.id === selectedResourceId);
      if (found) {
        return { resource: found, parentTopic: t };
      }
    }
    return null;
  }, [selectedResourceId, resolvedTopics]);

  const handleOpenResourceDetail = (resource: ResourceItem) => {
    setSelectedResourceId(resource.id);
    window.location.hash = `/resource/${resource.id}`;
  };

  const handleBackFromResourceDetail = () => {
    setSelectedResourceId(null);
    window.location.hash = `/${viewMode}`;
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSelectedResourceId(null);
    window.location.hash = `/${mode}`;
  };

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
    setDeletedResourceIds((prev) => prev.filter((id) => id !== resource.id));

    try {
      const saved = await upsertResource(resource, deletedResourceIds);
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

    // Optimistic deletion
    setDbResources((prev) => prev.filter((r) => r.id !== resourceId));
    setDeletedResourceIds((prev) => Array.from(new Set([...prev, resourceId])));
    setCollections((prev) => ({
      ...prev,
      savedResources: {
        ...prev.savedResources,
        [resourceId]: false
      },
      deletedResourceIds: {
        ...prev.deletedResourceIds,
        [resourceId]: true
      }
    }));

    try {
      await deleteResource(resourceId, deletedResourceIds);
      showToast('Resource deleted permanently from Supabase.');
      if (selectedResourceId === resourceId) {
        setSelectedResourceId(null);
      }
    } catch (err) {
      console.error('Failed to delete resource in Supabase:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete resource';
      alert(`Supabase Error: ${message}`);
      refreshResources();
    }

    setDeletingResource(null);
    setIsDeleteModalOpen(false);
  };

  const handleReorderResources = async (newOrderIds: string[]) => {
    if (!isAdmin) return;

    // Optimistically update collections state
    setCollections((prev) => ({
      ...prev,
      resourceOrder: newOrderIds
    }));

    showToast('Updating resource order...');

    try {
      await saveResourceOrder(newOrderIds);
      showToast('Resource position order saved permanently to Supabase!');
    } catch (err) {
      console.error('Failed to save resource order:', err);
      showToast('Failed to save resource order to database.');
    }
  };

  const handleFetchDb = async () => {
    setIsFetching(true);
    try {
      const result = await refreshResources();
      showToast(`Fetched ${result.resources.length} learning resources from Supabase!`);
    } catch (err) {
      console.error('Failed to fetch from Supabase:', err);
      showToast('Failed to fetch resources from Supabase.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSyncAll = async () => {
    if (!isAdmin) return;
    setIsSyncing(true);
    try {
      const currentActiveResources = resolvedTopics.flatMap((t) => t.resources);
      const success = await pushWebsiteStateToSupabase(
        currentActiveResources,
        deletedResourceIds,
        collections.resourceOrder,
        topicOverrides
      );
      if (success) {
        await refreshResources();
        showToast('Website changes and card positions synced permanently to Supabase!');
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
        onViewModeChange={handleViewModeChange}
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
        onFetchDb={handleFetchDb}
        isFetching={isFetching}
        onOpenSageAi={() => setIsSageAiOpen(true)}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-[#0D1117]/95 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-2xl backdrop-blur-md animate-fadeIn flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* RENDER DEDICATED RESOURCE DETAIL PAGE (KRISH NAIK STYLE) OR MASTER VIEW */}
      {selectedResourceData ? (
        <ResourceDetailPage
          resource={selectedResourceData.resource}
          parentTopic={selectedResourceData.parentTopic}
          allTopics={resolvedTopics}
          isSaved={!!collections.savedResources[selectedResourceData.resource.id]}
          onToggleSave={handleToggleSaveResource}
          onEdit={adminEditHandler}
          onDelete={adminDeleteHandler}
          onBack={handleBackFromResourceDetail}
          onSelectTopic={(tId) => {
            setCurrentTopicId(tId);
            setDashboardTopicId(tId);
            setSelectedResourceId(null);
            window.location.hash = `/canvas`;
          }}
          onSelectResource={(r) => handleOpenResourceDetail(r)}
          isAdmin={isAdmin}
          onOpenSageAi={(tId) => {
            setCurrentTopicId(tId);
            setIsSageAiOpen(true);
          }}
        />
      ) : (
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

            {viewMode === 'projects' && (
              <ResourceExplorerView
                topics={resolvedTopics}
                savedResources={collections.savedResources}
                onToggleSave={handleToggleSaveResource}
                onSelectTopic={handleSelectTopic}
                onOpenResourceDetail={handleOpenResourceDetail}
                isAdmin={isAdmin}
                resourceOrder={collections.resourceOrder}
                onReorderResources={isAdmin ? handleReorderResources : undefined}
                onAddResourceClick={adminAddHandler}
                onEditResource={adminEditHandler}
                onDeleteResource={adminDeleteHandler}
                defaultType="project"
                viewTitle="AI & Agentic Practical Projects"
                viewSubtitle="Explore real-world end-to-end projects with code repositories, system architectures, and step-by-step implementation guides."
              />
            )}

            {viewMode === 'courses' && (
              <ResourceExplorerView
                topics={resolvedTopics}
                savedResources={collections.savedResources}
                onToggleSave={handleToggleSaveResource}
                onSelectTopic={handleSelectTopic}
                onOpenResourceDetail={handleOpenResourceDetail}
                isAdmin={isAdmin}
                resourceOrder={collections.resourceOrder}
                onReorderResources={isAdmin ? handleReorderResources : undefined}
                onAddResourceClick={adminAddHandler}
                onEditResource={adminEditHandler}
                onDeleteResource={adminDeleteHandler}
                defaultType="course"
                viewTitle="Curated AI & ML Online Courses"
                viewSubtitle="Masterclasses, specializations, and verified certifications from Coursera, Udemy, Fast.ai, and DeepLearning.AI."
              />
            )}

            {viewMode === 'youtube' && (
              <ResourceExplorerView
                topics={resolvedTopics}
                savedResources={collections.savedResources}
                onToggleSave={handleToggleSaveResource}
                onSelectTopic={handleSelectTopic}
                onOpenResourceDetail={handleOpenResourceDetail}
                isAdmin={isAdmin}
                resourceOrder={collections.resourceOrder}
                onReorderResources={isAdmin ? handleReorderResources : undefined}
                onAddResourceClick={adminAddHandler}
                onEditResource={adminEditHandler}
                onDeleteResource={adminDeleteHandler}
                defaultType="youtube"
                viewTitle="YouTube Video Masterclasses & Playlists"
                viewSubtitle="Comprehensive video lectures, playlists, tutorials, and crash courses across all 10 mastery steps."
              />
            )}

            {viewMode === 'github' && (
              <ResourceExplorerView
                topics={resolvedTopics}
                savedResources={collections.savedResources}
                onToggleSave={handleToggleSaveResource}
                onSelectTopic={handleSelectTopic}
                onOpenResourceDetail={handleOpenResourceDetail}
                isAdmin={isAdmin}
                resourceOrder={collections.resourceOrder}
                onReorderResources={isAdmin ? handleReorderResources : undefined}
                onAddResourceClick={adminAddHandler}
                onEditResource={adminEditHandler}
                onDeleteResource={adminDeleteHandler}
                defaultType="github"
                viewTitle="Open Source GitHub Repositories"
                viewSubtitle="Production frameworks, AI libraries, algorithms, benchmarks, and starter code repositories."
              />
            )}

            {viewMode === 'papers' && (
              <ResourceExplorerView
                topics={resolvedTopics}
                savedResources={collections.savedResources}
                onToggleSave={handleToggleSaveResource}
                onSelectTopic={handleSelectTopic}
                onOpenResourceDetail={handleOpenResourceDetail}
                isAdmin={isAdmin}
                resourceOrder={collections.resourceOrder}
                onReorderResources={isAdmin ? handleReorderResources : undefined}
                onAddResourceClick={adminAddHandler}
                onEditResource={adminEditHandler}
                onDeleteResource={adminDeleteHandler}
                defaultType="paper"
                viewTitle="Seminal Research Papers"
                viewSubtitle="Milestone AI/ML papers from arXiv, NeurIPS, ICML, CVPR, and top conference publications."
              />
            )}

            {viewMode === 'books' && (
              <ResourceExplorerView
                topics={resolvedTopics}
                savedResources={collections.savedResources}
                onToggleSave={handleToggleSaveResource}
                onSelectTopic={handleSelectTopic}
                onOpenResourceDetail={handleOpenResourceDetail}
                isAdmin={isAdmin}
                resourceOrder={collections.resourceOrder}
                onReorderResources={isAdmin ? handleReorderResources : undefined}
                onAddResourceClick={adminAddHandler}
                onEditResource={adminEditHandler}
                onDeleteResource={adminDeleteHandler}
                defaultType="book"
                viewTitle="Textbooks & Reference Literature"
                viewSubtitle="Definitive textbooks and foundational reference literature on mathematics, ML, deep learning, and MLOps."
              />
            )}

            {viewMode === 'blogs' && (
              <ResourceExplorerView
                topics={resolvedTopics}
                savedResources={collections.savedResources}
                onToggleSave={handleToggleSaveResource}
                onSelectTopic={handleSelectTopic}
                onOpenResourceDetail={handleOpenResourceDetail}
                isAdmin={isAdmin}
                resourceOrder={collections.resourceOrder}
                onReorderResources={isAdmin ? handleReorderResources : undefined}
                onAddResourceClick={adminAddHandler}
                onEditResource={adminEditHandler}
                onDeleteResource={adminDeleteHandler}
                defaultType="article"
                viewTitle="Technical Articles & Engineering Blogs"
                viewSubtitle="In-depth technical writeups, architectural deep-dives, and production guides from industry practitioners."
              />
            )}

            {viewMode === 'explorer' && (
              <ResourceExplorerView
                topics={resolvedTopics}
                savedResources={collections.savedResources}
                onToggleSave={handleToggleSaveResource}
                onSelectTopic={handleSelectTopic}
                onOpenResourceDetail={handleOpenResourceDetail}
                isAdmin={isAdmin}
                resourceOrder={collections.resourceOrder}
                onReorderResources={isAdmin ? handleReorderResources : undefined}
                onAddResourceClick={adminAddHandler}
                onEditResource={adminEditHandler}
                onDeleteResource={adminDeleteHandler}
                defaultType="all"
                viewTitle="All AI & ML Learning Resources"
                viewSubtitle="Browse, search, and bookmark hundreds of courses, GitHub repositories, research papers, and technical deep-dives across all 10 mastery steps."
              />
            )}
          </main>
        </div>
      )}

      <TopicDashboard
        topic={activeDashboardTopic}
        isOpen={dashboardTopicId !== null}
        onClose={() => setDashboardTopicId(null)}
        savedResources={collections.savedResources}
        onToggleSave={handleToggleSaveResource}
        onEditResource={adminEditHandler}
        onDeleteResource={adminDeleteHandler}
        onOpenResourceDetail={handleOpenResourceDetail}
        onEditTopic={isAdmin ? handleOpenEditTopic : undefined}
        topicNote={dashboardTopicId ? collections.topicNotes[dashboardTopicId] || '' : ''}
        onSaveNote={handleSaveNote}
        onSelectTopic={handleSelectTopic}
        onAddCustomResourceClick={isAdmin ? handleOpenAddResourceModal : undefined}
        onOpenSageAi={(id) => {
          setCurrentTopicId(id);
          setIsSageAiOpen(true);
        }}
      />

      {/* Floating AI Chatbot Button (Visible on all views when drawer is closed) */}
      {!isSageAiOpen && (
        <button
          onClick={() => setIsSageAiOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-[2px] rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-indigo-600 shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group"
          title="Open SageAI Tutor Assistant"
        >
          <div className="w-14 h-14 rounded-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
            {/* Glowing animated background aura */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-yellow-400/20 to-indigo-600/20 animate-pulse" />
            
            {/* Bot Icon */}
            <Bot className="w-7 h-7 text-amber-300 group-hover:text-amber-200 transition-colors z-10 stroke-[2.2]" />

            {/* Glowing status indicator */}
            <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-950 animate-ping" />
            <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-950" />
          </div>
        </button>
      )}

      <SageAITutorDrawer
        isOpen={isSageAiOpen}
        onClose={() => setIsSageAiOpen(false)}
        topic={resolvedTopics.find((t) => t.id === currentTopicId) || resolvedTopics[0]}
        topics={resolvedTopics}
        onSelectTopic={handleSelectTopic}
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

          <TopicEditModal
            topic={editingTopic}
            isOpen={isTopicEditModalOpen}
            onClose={() => {
              setIsTopicEditModalOpen(false);
              setEditingTopic(null);
            }}
            onSaveTopic={handleSaveTopic}
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
      />
    </div>
  );
}
