import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Workspace, Community } from '../types';
import { mockWorkspaces, mockCommunities } from '../services/api';

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref<Workspace[]>(mockWorkspaces);
  const currentWorkspaceId = ref<string>('ws-1');
  const communities = ref<Community[]>(mockCommunities);

  const currentWorkspace = computed(() =>
    workspaces.value.find((w) => w.id === currentWorkspaceId.value) || workspaces.value[0]
  );

  const activeCommunities = computed(() =>
    communities.value.filter((c) => c.workspaceId === currentWorkspaceId.value)
  );

  function selectWorkspace(id: string) {
    currentWorkspaceId.value = id;
  }

  function addWorkspace(newWs: Omit<Workspace, 'id' | 'communitiesCount'>) {
    const created: Workspace = {
      ...newWs,
      id: `ws-${Date.now()}`,
      communitiesCount: 0,
    };
    workspaces.value.push(created);
    currentWorkspaceId.value = created.id;
  }

  return {
    workspaces,
    currentWorkspaceId,
    communities,
    currentWorkspace,
    activeCommunities,
    selectWorkspace,
    addWorkspace,
  };
});
