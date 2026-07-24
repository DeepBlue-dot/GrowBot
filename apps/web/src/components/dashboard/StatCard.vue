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
  <div class="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all duration-300 shadow-xl group">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ title }}</span>
      <div 
        class="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
        :class="accentColor || 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'"
      >
        <component :is="icon" class="w-5 h-5" />
      </div>
    </div>

    <div class="mt-4 flex items-baseline justify-between">
      <h3 class="text-2xl font-bold text-slate-100 tracking-tight">{{ value }}</h3>
      <div 
        v-if="change"
        class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
        :class="isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'"
      >
        <TrendingUp v-if="isPositive" class="w-3 h-3" />
        <TrendingDown v-else class="w-3 h-3" />
        <span>{{ change }}</span>
      </div>
    </div>
  </div>
</template>
