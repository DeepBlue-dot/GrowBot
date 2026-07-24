<script setup lang="ts">
import { useCampaignStore } from '../../stores/campaignStore';
import { Gift, CheckCircle, XCircle, Clock } from 'lucide-vue-next';
import type { RewardStatus } from '../../types';

const campaignStore = useCampaignStore();

function setStatus(id: string, status: RewardStatus) {
  campaignStore.updateRewardStatus(id, status);
}
</script>

<template>
  <div class="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
    <div class="p-6 border-b border-slate-800 flex items-center justify-between">
      <div>
        <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
          <Gift class="w-5 h-5 text-indigo-400" />
          <span>Reward Fulfillment Queue</span>
        </h3>
        <p class="text-xs text-slate-400 mt-1">Approve, fulfill, or reject milestone rewards for top inviters</p>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm text-slate-300">
        <thead class="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
          <tr>
            <th class="px-6 py-3.5">Campaign</th>
            <th class="px-6 py-3.5">Winner</th>
            <th class="px-6 py-3.5">Reward Title</th>
            <th class="px-6 py-3.5">Earned Date</th>
            <th class="px-6 py-3.5">Status</th>
            <th class="px-6 py-3.5 text-right">Fulfillment Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60 font-medium">
          <tr 
            v-for="reward in campaignStore.rewards" 
            :key="reward.id"
            class="hover:bg-slate-800/40 transition"
          >
            <!-- Campaign Title -->
            <td class="px-6 py-4 font-bold text-slate-200">
              {{ reward.campaignTitle }}
            </td>

            <!-- Winner Username -->
            <td class="px-6 py-4">
              <span class="text-indigo-400 font-mono">@{{ reward.winnerUsername }}</span>
              <p class="text-[11px] text-slate-500 font-mono">ID: {{ reward.winnerTelegramId }}</p>
            </td>

            <!-- Reward Title -->
            <td class="px-6 py-4 text-slate-300">
              {{ reward.rewardTitle }}
            </td>

            <!-- Date -->
            <td class="px-6 py-4 text-xs font-mono text-slate-400">
              {{ reward.createdAt }}
            </td>

            <!-- Status Pill -->
            <td class="px-6 py-4">
              <span 
                class="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
                :class="{
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30': reward.status === 'DELIVERED' || reward.status === 'APPROVED',
                  'bg-amber-500/10 text-amber-400 border border-amber-500/30': reward.status === 'PENDING',
                  'bg-rose-500/10 text-rose-400 border border-rose-500/30': reward.status === 'REJECTED'
                }"
              >
                <Clock v-if="reward.status === 'PENDING'" class="w-3.5 h-3.5 text-amber-400" />
                <CheckCircle v-else-if="reward.status === 'APPROVED' || reward.status === 'DELIVERED'" class="w-3.5 h-3.5 text-emerald-400" />
                <XCircle v-else class="w-3.5 h-3.5 text-rose-400" />
                {{ reward.status }}
              </span>
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2" v-if="reward.status === 'PENDING'">
                <button 
                  @click="setStatus(reward.id, 'APPROVED')"
                  class="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer"
                >
                  Approve
                </button>
                <button 
                  @click="setStatus(reward.id, 'REJECTED')"
                  class="px-3 py-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold shadow transition cursor-pointer"
                >
                  Reject
                </button>
              </div>
              <button 
                v-else-if="reward.status === 'APPROVED'"
                @click="setStatus(reward.id, 'DELIVERED')"
                class="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition cursor-pointer"
              >
                Mark Delivered
              </button>
              <span v-else class="text-xs text-slate-500 font-mono">Fulfilled</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
