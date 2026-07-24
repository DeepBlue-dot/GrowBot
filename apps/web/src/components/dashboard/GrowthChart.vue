<script setup lang="ts">
import { mockGrowthStats } from '../../services/api';
import { TrendingUp, Users, UserCheck } from 'lucide-vue-next';
</script>

<template>
  <div class="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
          <TrendingUp class="w-5 h-5 text-indigo-400" />
          <span>Community Growth Velocity</span>
        </h3>
        <p class="text-xs text-slate-400 mt-1">Daily joins vs validated referral conversions (7-day window)</p>
      </div>

      <div class="flex items-center gap-4 text-xs font-medium">
        <span class="flex items-center gap-1.5 text-indigo-400">
          <span class="w-3 h-3 rounded-full bg-indigo-500"></span>
          Total Joins
        </span>
        <span class="flex items-center gap-1.5 text-emerald-400">
          <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
          Valid Referrals
        </span>
      </div>
    </div>

    <!-- Visual Bar Chart -->
    <div class="h-56 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-800/80">
      <div 
        v-for="stat in mockGrowthStats" 
        :key="stat.date"
        class="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end"
      >
        <!-- Tooltip Hover -->
        <div class="absolute -top-10 bg-slate-950 text-slate-200 text-[11px] font-mono px-2 py-1 rounded border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 whitespace-nowrap">
          {{ stat.joins }} joins • {{ stat.validReferrals }} referrals
        </div>

        <div class="w-full flex items-end justify-center gap-1.5 h-full">
          <!-- Total Joins Bar -->
          <div 
            class="w-1/2 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all duration-500 group-hover:brightness-125"
            :style="{ height: `${(stat.joins / 350) * 100}%` }"
          ></div>
          <!-- Valid Referrals Bar -->
          <div 
            class="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 group-hover:brightness-125"
            :style="{ height: `${(stat.validReferrals / 350) * 100}%` }"
          ></div>
        </div>

        <span class="text-[11px] font-medium text-slate-400 mt-2">{{ stat.date }}</span>
      </div>
    </div>

    <div class="mt-4 flex items-center justify-between text-xs text-slate-400">
      <span class="flex items-center gap-1.5">
        <Users class="w-4 h-4 text-indigo-400" />
        Avg. Daily Organic Joins: <strong class="text-slate-200 font-mono">198</strong>
      </span>
      <span class="flex items-center gap-1.5">
        <UserCheck class="w-4 h-4 text-emerald-400" />
        Referral Conversion Rate: <strong class="text-emerald-400 font-mono">72.4%</strong>
      </span>
    </div>
  </div>
</template>
