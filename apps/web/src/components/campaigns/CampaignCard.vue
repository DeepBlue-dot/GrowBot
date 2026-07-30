<script setup lang="ts">
import { computed } from 'vue';
import type { Campaign } from '../../types';
import { Users, Award, CheckCircle2, Clock, MessageSquare, Play, Pause, Download, Sparkles } from 'lucide-vue-next';

const props = defineProps<{
  campaign: Campaign;
}>();

const emit = defineEmits<{
  (e: 'toggle-status', id: string): void;
}>();

function downloadCsv() {
  const url = `/api/campaigns/${props.campaign.id}/export`;
  window.open(url, '_blank');
}

const progressPercentage = computed(() => {
  if (!props.campaign.targetReferrals || props.campaign.targetReferrals === 0) return 100;
  const pct = Math.round(((props.campaign.validatedReferrals || 0) / props.campaign.targetReferrals) * 100);
  return Math.min(pct, 100);
});
</script>

<template>
  <div class="relative bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transform hover:-translate-y-1 transition-all duration-300 group">
    <!-- Top Gradient Accent Line -->
    <div 
      class="h-1.5 w-full bg-gradient-to-r"
      :class="campaign.type === 'MILESTONE' ? 'from-indigo-500 via-purple-500 to-pink-500' : 'from-amber-500 via-orange-500 to-yellow-500'"
    ></div>

    <div class="p-6">
      <!-- Card Header -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span 
              class="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-sm"
              :class="campaign.type === 'MILESTONE' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'"
            >
              {{ campaign.type }}
            </span>
            <span 
              class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shadow-sm"
              :class="campaign.isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="campaign.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'"></span>
              {{ campaign.isActive ? 'Active' : 'Paused' }}
            </span>
          </div>
          <h3 class="text-lg font-bold text-slate-100 mt-2.5 group-hover:text-indigo-400 transition-colors duration-200">
            {{ campaign.title }}
          </h3>
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="downloadCsv"
            class="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-indigo-400 border border-slate-700/60 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
            title="Export Campaign Data CSV"
          >
            <Download class="w-4 h-4 text-indigo-400" />
          </button>
          <button 
            @click="emit('toggle-status', campaign.id)"
            class="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
            :title="campaign.isActive ? 'Pause Campaign' : 'Activate Campaign'"
          >
            <Pause v-if="campaign.isActive" class="w-4 h-4 text-amber-400" />
            <Play v-else class="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      <p class="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
        {{ campaign.description }}
      </p>

      <!-- Target & Reward Box -->
      <div class="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 shadow-inner">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
            <Award class="w-5 h-5" />
          </div>
          <div>
            <p class="text-xs font-bold text-slate-200 flex items-center gap-1">
              <span>{{ campaign.rewardTitle }}</span>
              <Sparkles class="w-3 h-3 text-amber-400 inline" />
            </p>
            <p class="text-[11px] text-slate-400">Target: <strong class="text-slate-200 font-mono">{{ campaign.targetReferrals }}</strong> valid invites per user</p>
          </div>
        </div>
        <span class="text-xs font-bold font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
          {{ progressPercentage }}%
        </span>
      </div>

      <!-- Referral Progress Bar -->
      <div class="mt-3 space-y-1">
        <div class="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/80 shadow-inner">
          <div 
            class="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Anti-Cheat Validation Rules Badges -->
      <div class="mt-4">
        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Anti-Cheat Validation Rules</label>
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="rule in campaign.rules" 
            :key="rule.id"
            class="px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800/90 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 shadow-sm"
          >
            <Clock v-if="rule.type === 'TIME_BOUND'" class="w-3.5 h-3.5 text-indigo-400" />
            <MessageSquare v-else-if="rule.type === 'MESSAGE_COUNT'" class="w-3.5 h-3.5 text-purple-400" />
            <CheckCircle2 v-else class="w-3.5 h-3.5 text-emerald-400" />

            <span v-if="rule.type === 'TIME_BOUND'">Min Stay {{ rule.minStayHours }}h</span>
            <span v-else-if="rule.type === 'MESSAGE_COUNT'">Min {{ rule.minMessages }} Msgs</span>
            <span v-else>Instant Credit</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Metrics Footer -->
    <div class="px-6 py-3.5 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
      <div class="flex items-center gap-1.5">
        <Users class="w-4 h-4 text-indigo-400" />
        <span><strong class="text-slate-200 font-mono">{{ campaign.totalParticipants }}</strong> Participants</span>
      </div>
      <div class="flex items-center gap-1.5">
        <CheckCircle2 class="w-4 h-4 text-emerald-400" />
        <span><strong class="text-emerald-400 font-mono">{{ campaign.validatedReferrals }}</strong> Invites Verified</span>
      </div>
    </div>
  </div>
</template>
