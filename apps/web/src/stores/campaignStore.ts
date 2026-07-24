import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Campaign, LeaderboardEntry, RewardRecord } from '../types';
import { mockCampaigns, mockLeaderboard, mockRewards } from '../services/api';

export const useCampaignStore = defineStore('campaign', () => {
  const campaigns = ref<Campaign[]>(mockCampaigns);
  const leaderboard = ref<LeaderboardEntry[]>(mockLeaderboard);
  const rewards = ref<RewardRecord[]>(mockRewards);
  const selectedCampaignId = ref<string>('camp-1');

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

  return {
    campaigns,
    leaderboard,
    rewards,
    selectedCampaignId,
    activeCampaigns,
    selectedCampaign,
    totalValidatedReferrals,
    totalParticipants,
    createCampaign,
    toggleCampaignStatus,
    updateRewardStatus,
  };
});
