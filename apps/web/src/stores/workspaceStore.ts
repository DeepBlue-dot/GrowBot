import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Workspace, Community } from '../types';
import api, { mockWorkspaces, mockCommunities } from '../services/api';

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref<Workspace[]>(mockWorkspaces);
  const currentWorkspaceId = ref<string>('ws-1');
  const communities = ref<Community[]>(mockCommunities);
  const isLoading = ref<boolean>(false);

  const currentWorkspace = computed(() =>
    workspaces.value.find((w) => w.id === currentWorkspaceId.value) || workspaces.value[0]
  );

  const activeCommunities = computed(() =>
    communities.value.filter((c) => c.workspaceId === currentWorkspaceId.value)
  );

  async function fetchWorkspaces() {
    isLoading.value = true;
    try {
      const res = await api.get<Workspace[]>('/workspaces');
      if (res.data && res.data.length > 0) {
        workspaces.value = res.data;
        if (!workspaces.value.some((w) => w.id === currentWorkspaceId.value)) {
          currentWorkspaceId.value = workspaces.value[0].id;
        }
      }
    } catch {
      // Keep fallback mock
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchCommunities() {
    try {
      const res = await api.get<Community[]>('/communities');
      if (res.data && res.data.length > 0) {
        communities.value = res.data;
      }
    } catch {
      // Keep fallback mock
    }
  }

  function selectWorkspace(id: string) {
    currentWorkspaceId.value = id;
  }

  async function addWorkspace(newWs: Omit<Workspace, 'id' | 'communitiesCount'>) {
    try {
      const res = await api.post<Workspace>('/workspaces', newWs);
      if (res.data) {
        workspaces.value.push(res.data);
        currentWorkspaceId.value = res.data.id;
        return res.data;
      }
    } catch {
      const created: Workspace = {
        ...newWs,
        id: `ws-${Date.now()}`,
        communitiesCount: 0,
      };
      workspaces.value.push(created);
      currentWorkspaceId.value = created.id;
      return created;
    }
  }

  // Initial fetch
  void fetchWorkspaces();
  void fetchCommunities();

  return {
    workspaces,
    currentWorkspaceId,
    communities,
    currentWorkspace,
    activeCommunities,
    isLoading,
    fetchWorkspaces,
    fetchCommunities,
    selectWorkspace,
    addWorkspace,
  };
});
