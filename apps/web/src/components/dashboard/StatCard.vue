<script setup lang="ts">
import { TrendingUp, TrendingDown } from 'lucide-vue-next';

defineProps<{
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: any;
  accentColor?: string;
}>();
</script>

<template>
  <div class="relative bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 hover:border-indigo-500/40 transition-all duration-300 shadow-xl group overflow-hidden transform hover:-translate-y-1">
    <!-- Subtle Background Glow Spot -->
    <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none"></div>

    <div class="relative z-10 flex items-center justify-between">
      <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{{ title }}</span>
      <div 
        class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-md"
        :class="accentColor || 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-indigo-500/10'"
      >
        <component :is="icon" class="w-5 h-5" />
      </div>
    </div>

    <div class="relative z-10 mt-4 flex items-baseline justify-between">
      <h3 class="text-2xl font-extrabold text-slate-100 tracking-tight font-mono">{{ value }}</h3>
      <div 
        v-if="change"
        class="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm"
        :class="isPositive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'"
      >
        <TrendingUp v-if="isPositive" class="w-3 h-3" />
        <TrendingDown v-else class="w-3 h-3" />
        <span>{{ change }}</span>
      </div>
    </div>
  </div>
</template>
