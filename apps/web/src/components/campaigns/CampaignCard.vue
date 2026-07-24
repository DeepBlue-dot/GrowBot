<script setup lang="ts">
import type { Campaign } from '../../types';
import { Users, Award, CheckCircle2, Clock, MessageSquare, Play, Pause } from 'lucide-vue-next';

const props = defineProps<{
  campaign: Campaign;
}>();

const emit = defineEmits<{
  (e: 'toggle-status', id: string): void;
}>();
</script>

<template>
  <div class="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-indigo-500/40 transition group">
    <div>
      <!-- Card Header -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span 
              class="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase"
              :class="campaign.type === 'MILESTONE' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'"
            >
              {{ campaign.type }}
            </span>
            <span 
              class="px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1"
              :class="campaign.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="campaign.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'"></span>
              {{ campaign.isActive ? 'Active' : 'Paused' }}
            </span>
          </div>
          <h3 class="text-lg font-bold text-slate-100 mt-2 group-hover:text-indigo-400 transition">
            {{ campaign.title }}
          </h3>
        </div>

        <button 
          @click="emit('toggle-status', campaign.id)"
          class="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          :title="campaign.isActive ? 'Pause Campaign' : 'Activate Campaign'"
        >
          <Pause v-if="campaign.isActive" class="w-4 h-4 text-amber-400" />
          <Play v-else class="w-4 h-4 text-emerald-400" />
        </button>
      </div>

      <p class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
        {{ campaign.description }}
      </p>

      <!-- Target & Reward Box -->
      <div class="mt-4 p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Award class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xs font-bold text-slate-200">{{ campaign.rewardTitle }}</p>
          <p class="text-[11px] text-slate-400">Target: {{ campaign.targetReferrals }} valid invites per user</p>
        </div>
      </div>

      <!-- Anti-Cheat Validation Rules Badges -->
      <div class="mt-4">
        <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Anti-Cheat Rules</label>
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="rule in campaign.rules" 
            :key="rule.id"
            class="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/60 text-[11px] font-mono text-slate-300 flex items-center gap-1.5"
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
    <div class="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
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
