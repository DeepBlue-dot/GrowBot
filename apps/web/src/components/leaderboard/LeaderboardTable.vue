<script setup lang="ts">
import { useCampaignStore } from '../../stores/campaignStore';
import { Trophy, UserCheck } from 'lucide-vue-next';

const campaignStore = useCampaignStore();

function getRankBadge(rank: number) {
  if (rank === 1) return { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40', label: '🥇 1st Place' };
  if (rank === 2) return { bg: 'bg-slate-300/20 text-slate-200 border-slate-300/40', label: '🥈 2nd Place' };
  if (rank === 3) return { bg: 'bg-amber-700/20 text-amber-600 border-amber-700/40', label: '🥉 3rd Place' };
  return { bg: 'bg-slate-800 text-slate-400 border-slate-700', label: `#${rank}` };
}
</script>

<template>
  <div class="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
    <div class="p-6 border-b border-slate-800 flex items-center justify-between">
      <div>
        <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
          <Trophy class="w-5 h-5 text-amber-400" />
          <span>Top Community Inviters</span>
        </h3>
        <p class="text-xs text-slate-400 mt-1">Real-time leaderboard updated via Telegram Webhook & Redis Attribution</p>
      </div>

      <div class="px-3 py-1 rounded-full bg-slate-800 text-xs font-mono text-slate-300 border border-slate-700">
        {{ campaignStore.leaderboard.length }} Participants Ranked
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm text-slate-300">
        <thead class="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
          <tr>
            <th class="px-6 py-3.5">Rank</th>
            <th class="px-6 py-3.5">Participant</th>
            <th class="px-6 py-3.5">Verified Invites</th>
            <th class="px-6 py-3.5">Pending Intent</th>
            <th class="px-6 py-3.5 text-right">Reward Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60 font-medium">
          <tr 
            v-for="entry in campaignStore.leaderboard" 
            :key="entry.participantId"
            class="hover:bg-slate-800/40 transition"
          >
            <!-- Rank -->
            <td class="px-6 py-4">
              <span 
                class="px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1"
                :class="getRankBadge(entry.rank).bg"
              >
                {{ getRankBadge(entry.rank).label }}
              </span>
            </td>

            <!-- User Profile -->
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <img 
                  :src="entry.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${entry.telegramId}`" 
                  alt="User"
                  class="w-9 h-9 rounded-full bg-slate-800 ring-2 ring-indigo-500/20"
                />
                <div>
                  <p class="font-bold text-slate-100 leading-tight">{{ entry.firstName }}</p>
                  <p class="text-xs text-indigo-400 font-mono">@{{ entry.username || 'anonymous' }}</p>
                </div>
              </div>
            </td>

            <!-- Verified Referrals -->
            <td class="px-6 py-4">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono">
                <UserCheck class="w-4 h-4" />
                {{ entry.validatedReferrals }} Referrals
              </span>
            </td>

            <!-- Pending Intents -->
            <td class="px-6 py-4 font-mono text-slate-400">
              <span v-if="entry.pendingReferrals > 0" class="text-amber-400">
                {{ entry.pendingReferrals }} Pending (Redis 24h)
              </span>
              <span v-else class="text-slate-500">0</span>
            </td>

            <!-- Reward Status -->
            <td class="px-6 py-4 text-right">
              <span 
                v-if="entry.rewardStatus"
                class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                :class="{
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30': entry.rewardStatus === 'APPROVED' || entry.rewardStatus === 'DELIVERED',
                  'bg-amber-500/10 text-amber-400 border border-amber-500/30': entry.rewardStatus === 'PENDING',
                  'bg-rose-500/10 text-rose-400 border border-rose-500/30': entry.rewardStatus === 'REJECTED'
                }"
              >
                {{ entry.rewardStatus }}
              </span>
              <span v-else class="text-xs text-slate-500">In Progress</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
