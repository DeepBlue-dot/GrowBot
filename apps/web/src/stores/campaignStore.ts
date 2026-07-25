import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Campaign, LeaderboardEntry, RewardRecord } from '../types';
import api, { mockCampaigns, mockLeaderboard, mockRewards } from '../services/api';

export const useCampaignStore = defineStore('campaign', () => {
  const campaigns = ref<Campaign[]>(mockCampaigns);
  const leaderboard = ref<LeaderboardEntry[]>(mockLeaderboard);
  const rewards = ref<RewardRecord[]>(mockRewards);
  const selectedCampaignId = ref<string>('camp-1');
  const isLoading = ref<boolean>(false);

  const activeCampaigns = computed(() => campaigns.value.filter((c) => c.isActive));

  const selectedCampaign = computed(() =>
    campaigns.value.find((c) => c.id === selectedCampaignId.value) || campaigns.value[0]
  );

  const totalValidatedReferrals = computed(() =>
    campaigns.value.reduce((acc, c) => acc + c.validatedReferrals, 0)
  );

  const totalParticipants = computed(() =>
    campaigns.value.reduce((acc, c) => acc + c.totalParticipants, 0)
  );

  async function fetchCampaigns() {
    isLoading.value = true;
    try {
      const res = await api.get<Campaign[]>('/campaigns');
      if (res.data && res.data.length > 0) {
        campaigns.value = res.data;
        if (!campaigns.value.some((c) => c.id === selectedCampaignId.value)) {
          selectedCampaignId.value = campaigns.value[0].id;
        }
      }
    } catch {
      // Keep fallback
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchLeaderboard() {
    try {
      const res = await api.get<LeaderboardEntry[]>('/campaigns/leaderboard');
      if (res.data && res.data.length > 0) {
        leaderboard.value = res.data;
      }
    } catch {
      // Keep fallback
    }
  }

  async function fetchRewards() {
    try {
      const res = await api.get<RewardRecord[]>('/rewards');
      if (res.data && res.data.length > 0) {
        rewards.value = res.data;
      }
    } catch {
      // Keep fallback
    }
  }

  async function createCampaign(newCamp: Partial<Campaign>) {
    try {
      const res = await api.post<Campaign>('/campaigns', newCamp);
      if (res.data) {
        campaigns.value.unshift(res.data);
        return res.data;
      }
    } catch {
      const created: Campaign = {
        id: `camp-${Date.now()}`,
        communityId: newCamp.communityId || 'comm-1',
        title: newCamp.title || 'New Campaign',
        description: newCamp.description || '',
        type: newCamp.type || 'MILESTONE',
        targetReferrals: newCamp.targetReferrals || 5,
        rewardTitle: newCamp.rewardTitle || 'VIP Pass',
        rewardDescription: newCamp.rewardDescription,
        isActive: true,
        startDate: newCamp.startDate || new Date().toISOString().split('T')[0],
        rules: newCamp.rules || [{ id: `r-${Date.now()}`, type: 'IMMEDIATE' }],
        totalParticipants: 0,
        validatedReferrals: 0,
      };
      campaigns.value.unshift(created);
      return created;
    }
  }

  async function toggleCampaignStatus(id: string) {
    const target = campaigns.value.find((c) => c.id === id);
    if (target) {
      const nextStatus = target.isActive ? 'PAUSED' : 'ACTIVE';
      target.isActive = !target.isActive;
      try {
        await api.patch(`/campaigns/${id}/status`, { status: nextStatus });
      } catch {
        // Keep optimistic state update
      }
    }
  }

  async function updateRewardStatus(rewardId: string, status: RewardRecord['status']) {
    const target = rewards.value.find((r) => r.id === rewardId);
    if (target) {
      target.status = status;
      try {
        await api.patch(`/rewards/${rewardId}/status`, { status });
      } catch {
        // Keep optimistic state update
      }
    }
  }

  // Initial fetch
  void fetchCampaigns();
  void fetchLeaderboard();
  void fetchRewards();

  return {
    campaigns,
    leaderboard,
    rewards,
    selectedCampaignId,
    activeCampaigns,
    selectedCampaign,
    totalValidatedReferrals,
    totalParticipants,
    isLoading,
    fetchCampaigns,
    fetchLeaderboard,
    fetchRewards,
    createCampaign,
    toggleCampaignStatus,
    updateRewardStatus,
  };
});
