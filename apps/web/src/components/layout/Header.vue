<script setup lang="ts">
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useTelegramStore } from '../../stores/telegramStore';
import { useAuthStore } from '../../stores/authStore';
import { useRouter } from 'vue-router';
import { ShieldCheck, Plus, LogOut } from 'lucide-vue-next';

defineProps<{
  title: string;
  subtitle?: string;
}>();

defineEmits<{
  (e: 'open-create-modal'): void;
}>();

const workspaceStore = useWorkspaceStore();
const telegramStore = useTelegramStore();
const authStore = useAuthStore();
const router = useRouter();

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <header class="h-20 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 z-20">
    <div>
      <h2 class="text-xl font-bold text-slate-100 tracking-tight">{{ title }}</h2>
      <p v-if="subtitle" class="text-xs text-slate-400 mt-0.5">{{ subtitle }}</p>
    </div>

    <div class="flex items-center gap-4">
      <!-- Community Sync Badge -->
      <div 
        v-if="workspaceStore.activeCommunities.length > 0"
        class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400"
      >
        <ShieldCheck class="w-4 h-4 text-emerald-400" />
        <span>{{ workspaceStore.activeCommunities[0].title }} (Bot Active)</span>
      </div>

      <!-- Quick Action: Create Campaign -->
      <button
        @click="$emit('open-create-modal')"
        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>New Campaign</span>
      </button>

      <!-- Telegram Profile Avatar & Logout -->
      <div class="flex items-center gap-3 pl-2 border-l border-slate-800">
        <img 
          :src="authStore.user?.photoUrl || telegramStore.user?.photo_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=admin'"
          alt="Avatar"
          class="w-9 h-9 rounded-full bg-slate-800 ring-2 ring-indigo-500/30"
        />
        <div class="hidden lg:block text-left">
          <p class="text-xs font-semibold text-slate-200 leading-tight">
            {{ authStore.user?.firstName || telegramStore.user?.first_name || 'Admin User' }}
          </p>
          <p class="text-[11px] text-slate-400 font-mono">
            @{{ authStore.user?.username || telegramStore.user?.username || 'growbot_admin' }}
          </p>
        </div>
        <button
          @click="handleLogout"
          title="Sign Out"
          class="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </div>
  </header>
</template>
