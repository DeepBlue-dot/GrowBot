<script setup lang="ts">
import { ref } from 'vue';
import Header from '../components/layout/Header.vue';
import StatCard from '../components/dashboard/StatCard.vue';
import GrowthChart from '../components/dashboard/GrowthChart.vue';
import CampaignCard from '../components/campaigns/CampaignCard.vue';
import CreateCampaignModal from '../components/campaigns/CreateCampaignModal.vue';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useCampaignStore } from '../stores/campaignStore';
import { Users, UserCheck, Megaphone, Zap } from 'lucide-vue-next';

const workspaceStore = useWorkspaceStore();
const campaignStore = useCampaignStore();
const showCreateModal = ref(false);
</script>

<template>
  <div class="flex-1 min-h-screen bg-slate-950 text-slate-100 pb-12">
    <Header 
      title="Dashboard Overview" 
      subtitle="Real-time Telegram community growth metrics & campaign activity"
      @open-create-modal="showCreateModal = true" 
    />

    <main class="p-8 max-w-7xl mx-auto space-y-8">
      <!-- Top Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Community Members"
          :value="workspaceStore.activeCommunities[0]?.memberCount || 4820"
          change="+18.4% this week"
          :is-positive="true"
          :icon="Users"
          accent-color="bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
        />
        <StatCard 
          title="Verified Referrals"
          :value="campaignStore.totalValidatedReferrals"
          change="+240 today"
          :is-positive="true"
          :icon="UserCheck"
          accent-color="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
        />
        <StatCard 
          title="Active Campaigns"
          :value="campaignStore.activeCampaigns.length"
          :icon="Megaphone"
          accent-color="bg-amber-500/15 text-amber-400 border border-amber-500/30"
        />
        <StatCard 
          title="Attribution Velocity"
          value="< 120ms"
          change="Zero Rate-Limit"
          :is-positive="true"
          :icon="Zap"
          accent-color="bg-purple-500/15 text-purple-400 border border-purple-500/30"
        />
      </div>

      <!-- Growth Chart & Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <GrowthChart />
        </div>

        <!-- Quick Summary Panel -->
        <div class="bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 class="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Bot & Engine Status</span>
            </h3>
            
            <div class="space-y-4">
              <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between shadow-inner">
                <div>
                  <p class="text-xs font-bold text-slate-200">grammY Webhook Engine</p>
                  <p class="text-[11px] text-slate-400">Telegram Bot API</p>
                </div>
                <span class="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">CONNECTED</span>
              </div>

              <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between shadow-inner">
                <div>
                  <p class="text-xs font-bold text-slate-200">PostgreSQL Intent Pipeline</p>
                  <p class="text-[11px] text-slate-400">24h Intent Attribution</p>
                </div>
                <span class="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">HEALTHY</span>
              </div>

              <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between shadow-inner">
                <div>
                  <p class="text-xs font-bold text-slate-200">Anti-Cheat Revocation</p>
                  <p class="text-[11px] text-slate-400">Member Leave Tracker</p>
                </div>
                <span class="px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-xs font-mono font-bold">ACTIVE</span>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-800/80">
            <router-link 
              to="/miniapp" 
              class="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/40 hover:to-purple-600/40 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 transition duration-200 shadow-md"
            >
              <span>Test Mini App Experience 📱</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Active Campaigns Section -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-slate-100">Active Growth Campaigns</h3>
          <router-link to="/campaigns" class="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition">
            View All Campaigns →
          </router-link>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CampaignCard 
            v-for="campaign in campaignStore.activeCampaigns"
            :key="campaign.id"
            :campaign="campaign"
            @toggle-status="campaignStore.toggleCampaignStatus"
          />
        </div>
      </div>
    </main>

    <!-- Create Campaign Modal -->
    <CreateCampaignModal 
      v-if="showCreateModal" 
      @close="showCreateModal = false" 
    />
  </div>
</template>
