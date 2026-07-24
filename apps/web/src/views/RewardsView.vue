<script setup lang="ts">
import { ref } from 'vue';
import Header from '../components/layout/Header.vue';
import RewardTable from '../components/rewards/RewardTable.vue';
import CreateCampaignModal from '../components/campaigns/CreateCampaignModal.vue';

const showCreateModal = ref(false);
</script>

<template>
  <div class="flex-1 min-h-screen bg-slate-950 text-slate-100 pb-12">
    <Header 
      title="Reward Fulfillment" 
      subtitle="Oversee participant prize distribution, badge approvals, and status workflows"
      @open-create-modal="showCreateModal = true" 
    />

    <main class="p-8 max-w-7xl mx-auto space-y-8">
      <RewardTable />
    </main>

    <CreateCampaignModal 
      v-if="showCreateModal" 
      @close="showCreateModal = false" 
    />
  </div>
</template>
