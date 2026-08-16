import { RoadmapTopic, ResourceItem, UserCollections } from '../types';

/**
 * Resolves a single topic's resources by:
 * 1. Prepending custom resources for this topic
 * 2. Combining with base resources
 * 3. Applying user edits from `editedResources`
 * 4. Filtering out deleted resources from `deletedResourceIds`
 */
export function resolveTopicResources(
  topic: RoadmapTopic,
  collections: UserCollections
): RoadmapTopic {
  const { customResources = [], editedResources = {}, deletedResourceIds = {} } = collections;

  // Custom resources for this specific topic
  const customForTopic = customResources.filter((r) => r.topicId === topic.id);

  // Combine custom resources with default topic resources
  const combined = [...customForTopic, ...topic.resources];

  // Apply edits and filter deletions
  const resolvedResources: ResourceItem[] = [];

  for (const res of combined) {
    if (deletedResourceIds[res.id]) {
      // Skip deleted
      continue;
    }

    const edited = editedResources[res.id];
    if (edited) {
      resolvedResources.push({
        ...edited,
        isEdited: true
      });
    } else {
      resolvedResources.push(res);
    }
  }

  return {
    ...topic,
    resources: resolvedResources
  };
}

/**
 * Resolves all topics and their resources based on current user collections state.
 */
export function resolveAllTopics(
  topics: RoadmapTopic[],
  collections: UserCollections
): RoadmapTopic[] {
  return topics.map((t) => resolveTopicResources(t, collections));
}

/**
 * Merges Supabase-managed resources into static roadmap topics.
 * Uses DB resources for a topic when available, otherwise falls back to static data.
 */
export function mergeTopicsWithDbResources(
  topics: RoadmapTopic[],
  dbResources: ResourceItem[]
): RoadmapTopic[] {
  if (dbResources.length === 0) {
    return topics;
  }

  const byTopic = new Map<number, ResourceItem[]>();
  for (const res of dbResources) {
    const list = byTopic.get(res.topicId) || [];
    list.push(res);
    byTopic.set(res.topicId, list);
  }

  return topics.map((topic) => {
    const dbForTopic = byTopic.get(topic.id);
    return {
      ...topic,
      resources: dbForTopic && dbForTopic.length > 0 ? dbForTopic : topic.resources
    };
  });
}

/**
 * Resolves all resources across all topics with metadata for cataloging/filtering.
 */
export function resolveAllCatalogResources(
  topics: RoadmapTopic[],
  collections: UserCollections
) {
  const resolvedTopics = resolveAllTopics(topics, collections);
  return resolvedTopics.flatMap((topic) =>
    topic.resources.map((res) => ({
      ...res,
      topicNumber: topic.stepNumber,
      topicTitle: topic.title,
      topicCategory: topic.categoryLabel
    }))
  );
}
