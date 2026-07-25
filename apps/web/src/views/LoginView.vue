<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { Bot, ShieldCheck, LogIn, Sparkles } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);

async function devLogin() {
  loading.value = true;
  await authStore.loginWithTelegram({
    id: 10928374,
    first_name: 'Alex',
    username: 'alex_web3',
    photo_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex',
  });
  loading.value = false;
  router.push('/');
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex justify-center items-center p-4">
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
      <div class="inline-flex p-4 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-xl shadow-indigo-500/30 text-white mb-2">
        <Bot class="w-10 h-10" />
      </div>

      <div>
        <h1 class="text-2xl font-bold text-slate-100">Welcome to GrowBot</h1>
        <p class="text-xs text-indigo-300 font-medium mt-1">Telegram Community Growth & Attribution Dashboard</p>
      </div>

      <div class="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3 text-left">
        <div class="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <ShieldCheck class="w-4 h-4 text-emerald-400" />
          <span>Secure Telegram Authentication</span>
        </div>
        <p class="text-xs text-slate-400 leading-relaxed">
          Log in with your Telegram account to access your workspace, manage referral campaigns, and view growth analytics.
        </p>
      </div>

      <div class="space-y-3">
        <button
          @click="devLogin"
          :disabled="loading"
          class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
        >
          <LogIn class="w-4 h-4" />
          <span>{{ loading ? 'Signing in...' : 'Sign in as Administrator (Dev Mode)' }}</span>
        </button>

        <div class="flex items-center gap-2 justify-center text-[11px] text-slate-500">
          <Sparkles class="w-3.5 h-3.5 text-indigo-400" />
          <span>Supports Telegram Login Widget & HMAC JWT Auth</span>
        </div>
      </div>
    </div>
  </div>
</template>
