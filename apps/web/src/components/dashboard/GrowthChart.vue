<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import api, { mockGrowthStats } from '../../services/api';
import { TrendingUp, Users, UserCheck } from 'lucide-vue-next';

interface StatItem {
  date: string;
  totalMembers: number;
  newJoins: number;
  leaves: number;
  totalReferrals: number;
  validatedReferrals: number;
}

const selectedDays = ref<number>(7);
const statsData = ref<Array<{ date: string; joins: number; validReferrals: number }>>([]);
const isLoading = ref<boolean>(false);

async function loadStats() {
  isLoading.value = true;
  try {
    const res = await api.get<StatItem[]>(`/communities/comm-1/stats?days=${selectedDays.value}`);
    if (res.data && res.data.length > 0) {
      statsData.value = res.data.map((s) => ({
        date: s.date,
        joins: s.newJoins,
        validReferrals: s.validatedReferrals,
      }));
    } else {
      statsData.value = mockGrowthStats.map((m) => ({
        date: m.date,
        joins: m.joins,
        validReferrals: m.validReferrals,
      }));
    }
  } catch {
    statsData.value = mockGrowthStats.map((m) => ({
      date: m.date,
      joins: m.joins,
      validReferrals: m.validReferrals,
    }));
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void loadStats();
});

watch(selectedDays, () => {
  void loadStats();
});
</script>

<template>
  <div class="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
          <TrendingUp class="w-5 h-5 text-indigo-400" />
          <span>Community Growth Velocity</span>
        </h3>
        <p class="text-xs text-slate-400 mt-1">Daily joins vs validated referral conversions ({{ selectedDays }}-day window)</p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Range Selector Tabs -->
        <div class="flex bg-slate-950/80 border border-slate-800 rounded-lg p-1 text-[11px] font-semibold text-slate-400">
          <button
            @click="selectedDays = 7"
            :class="selectedDays === 7 ? 'bg-indigo-600 text-white shadow' : 'hover:text-slate-200'"
            class="px-2.5 py-1 rounded transition cursor-pointer"
          >
            7D
          </button>
          <button
            @click="selectedDays = 30"
            :class="selectedDays === 30 ? 'bg-indigo-600 text-white shadow' : 'hover:text-slate-200'"
            class="px-2.5 py-1 rounded transition cursor-pointer"
          >
            30D
          </button>
          <button
            @click="selectedDays = 90"
            :class="selectedDays === 90 ? 'bg-indigo-600 text-white shadow' : 'hover:text-slate-200'"
            class="px-2.5 py-1 rounded transition cursor-pointer"
          >
            90D
          </button>
        </div>

        <div class="hidden sm:flex items-center gap-4 text-xs font-medium pl-2">
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
    </div>

    <!-- Visual Bar Chart -->
    <div class="h-56 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-800/80">
      <div 
        v-for="stat in statsData" 
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
            :style="{ height: `${Math.min(100, (stat.joins / 350) * 100)}%` }"
          ></div>
          <!-- Valid Referrals Bar -->
          <div 
            class="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 group-hover:brightness-125"
            :style="{ height: `${Math.min(100, (stat.validReferrals / 350) * 100)}%` }"
          ></div>
        </div>

        <span class="text-[11px] font-medium text-slate-400 mt-2 truncate max-w-[50px]">{{ stat.date }}</span>
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
