<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { 
  LayoutDashboard, 
  Megaphone, 
  Trophy, 
  Gift, 
  Smartphone, 
  Bot, 
  ChevronDown,
  Layers
} from 'lucide-vue-next';

const route = useRoute();
const workspaceStore = useWorkspaceStore();

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { name: 'Rewards', path: '/rewards', icon: Gift },
  { name: 'Telegram Mini App', path: '/miniapp', icon: Smartphone },
];
</script>

<template>
  <aside class="w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 z-30 text-slate-300">
    <!-- Brand Logo -->
    <div>
      <div class="p-5 flex items-center gap-3 border-b border-slate-800/80">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
          <Bot class="w-6 h-6" />
        </div>
        <div>
          <h1 class="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-tight">
            GrowBot
          </h1>
          <p class="text-xs text-indigo-400 font-medium">Telegram Referral Engine</p>
        </div>
      </div>

      <!-- Workspace Switcher -->
      <div class="px-3 py-4">
        <label class="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Workspace</label>
        <div class="relative">
          <select 
            :value="workspaceStore.currentWorkspaceId"
            @change="workspaceStore.selectWorkspace(($event.target as HTMLSelectElement).value)"
            class="w-full bg-slate-800/60 border border-slate-700/60 text-slate-200 text-sm rounded-lg px-3 py-2.5 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer transition"
          >
            <option 
              v-for="ws in workspaceStore.workspaces" 
              :key="ws.id" 
              :value="ws.id"
              class="bg-slate-900 text-slate-200"
            >
              {{ ws.name }} ({{ ws.plan }})
            </option>
          </select>
          <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="px-3 space-y-1 mt-2">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group"
          :class="[
            route.path === item.path
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
              : 'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
          ]"
        >
          <component 
            :is="item.icon" 
            class="w-5 h-5 transition-transform group-hover:scale-110"
            :class="route.path === item.path ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'"
          />
          <span>{{ item.name }}</span>
        </router-link>
      </nav>
    </div>

    <!-- Active Workspace Status Footer -->
    <div class="p-4 border-t border-slate-800/80 bg-slate-950/40">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Layers class="w-4 h-4" />
        </div>
        <div class="flex-1 overflow-hidden">
          <p class="text-xs font-semibold text-slate-200 truncate">{{ workspaceStore.currentWorkspace.name }}</p>
          <span class="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {{ workspaceStore.currentWorkspace.plan }} Tier Active
          </span>
        </div>
      </div>
    </div>
  </aside>
</template>
