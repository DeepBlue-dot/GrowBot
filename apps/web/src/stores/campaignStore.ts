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

  function createCampaign(newCamp: Omit<Campaign, 'id' | 'totalParticipants' | 'validatedReferrals'>) {
    const created: Campaign = {
      ...newCamp,
      id: `camp-${Date.now()}`,
      totalParticipants: 0,
      validatedReferrals: 0,
    };
    campaigns.value.unshift(created);
  }

  function toggleCampaignStatus(id: string) {
    const target = campaigns.value.find((c) => c.id === id);
    if (target) {
      target.isActive = !target.isActive;
    }
  }

  function updateRewardStatus(rewardId: string, status: RewardRecord['status']) {
    const target = rewards.value.find((r) => r.id === rewardId);
    if (target) {
      target.status = status;
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
