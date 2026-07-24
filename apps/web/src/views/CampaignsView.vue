<script setup lang="ts">
import { ref } from 'vue';
import Header from '../components/layout/Header.vue';
import CampaignCard from '../components/campaigns/CampaignCard.vue';
import CreateCampaignModal from '../components/campaigns/CreateCampaignModal.vue';
import { useCampaignStore } from '../stores/campaignStore';

const campaignStore = useCampaignStore();
const showCreateModal = ref(false);
</script>

<template>
  <div class="flex-1 min-h-screen bg-slate-950 text-slate-100 pb-12">
    <Header 
      title="Referral Campaign Manager" 
      subtitle="Configure milestone campaigns, leaderboard contests, and anti-cheat verification rules"
      @open-create-modal="showCreateModal = true" 
    />

    <main class="p-8 max-w-7xl mx-auto space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <CampaignCard 
          v-for="campaign in campaignStore.campaigns"
          :key="campaign.id"
          :campaign="campaign"
          @toggle-status="campaignStore.toggleCampaignStatus"
        />
      </div>
    </main>

    <CreateCampaignModal 
      v-if="showCreateModal" 
      @close="showCreateModal = false" 
    />
  </div>
</template>
