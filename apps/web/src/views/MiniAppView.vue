<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTelegramStore } from '../stores/telegramStore';
import { 
  Bot, 
  Share2, 
  Copy, 
  Check, 
  Gift, 
  UserPlus, 
  Zap, 
  ShieldCheck
} from 'lucide-vue-next';

const telegramStore = useTelegramStore();
const copied = ref(false);

onMounted(() => {
  telegramStore.initTelegramSDK();
});

function copyLink() {
  navigator.clipboard.writeText(telegramStore.referralLink);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

function shareTelegram() {
  const url = `https://t.me/share/url?url=${encodeURIComponent(telegramStore.referralLink)}&text=${encodeURIComponent('Join GrowBot Community & unlock VIP perks!')}`;
  window.open(url, '_blank');
}
</script>

<template>
  <div class="flex-1 min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex justify-center items-start">
    <!-- Telegram Mini App Mobile Mock Container -->
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between min-h-[640px]">
      <!-- App Header -->
      <div class="bg-gradient-to-b from-indigo-900/60 to-slate-900 p-6 text-center relative border-b border-slate-800/80">
        <div class="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30 text-white mb-3">
          <Bot class="w-8 h-8" />
        </div>
        <h2 class="text-xl font-bold text-slate-100">GrowBot Community</h2>
        <p class="text-xs text-indigo-300 font-medium mt-1">1-Tap Referral & Attribution Engine</p>

        <!-- Telegram Auth Status Badge -->
        <div class="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-emerald-400">
          <ShieldCheck class="w-3.5 h-3.5" />
          <span>HMAC Validated (@{{ telegramStore.user?.username || 'user' }})</span>
        </div>
      </div>

      <!-- App Body -->
      <div class="p-6 space-y-6 flex-1">
        <!-- Campaign Welcome Card -->
        <div class="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Summer Growth Sprint</span>
            <span class="text-[11px] font-semibold text-emerald-400">Active</span>
          </div>

          <h3 class="text-base font-bold text-slate-100 mb-1">Invite 5 Friends ➔ Unlock VIP Pass</h3>
          <p class="text-xs text-slate-400 leading-relaxed mb-4">
            Share your unique Mini App referral link with friends. Rate-limit free invite tracking.
          </p>

          <!-- Referral Progress Bar -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-xs font-semibold">
              <span class="text-slate-300">Your Invites Progress</span>
              <span class="text-indigo-400 font-mono">3 / 5 Verified</span>
            </div>
            <div class="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div class="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full w-[60%] transition-all duration-500"></div>
            </div>
          </div>
        </div>

        <!-- Referral Link Box -->
        <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Your Referral Link</label>
          
          <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-indigo-300 overflow-hidden">
            <span class="truncate flex-1">{{ telegramStore.referralLink }}</span>
            <button 
              @click="copyLink"
              class="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 transition cursor-pointer"
            >
              <Check v-if="copied" class="w-4 h-4 text-emerald-400" />
              <Copy v-else class="w-4 h-4" />
            </button>
          </div>

          <!-- Share Button -->
          <button 
            @click="shareTelegram"
            class="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Share2 class="w-4 h-4" />
            <span>Share Link to Telegram Chats</span>
          </button>
        </div>

        <!-- 5-Step Attribution Explainer -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">How Attribution Works</h4>
          
          <div class="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div class="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
              <UserPlus class="w-4 h-4 text-indigo-400 mx-auto mb-1" />
              <p class="font-semibold text-slate-300">1. Share</p>
            </div>
            <div class="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
              <Zap class="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <p class="font-semibold text-slate-300">2. PostgreSQL Intent</p>
            </div>
            <div class="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
              <Gift class="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p class="font-semibold text-slate-300">3. Webhook Credit</p>
            </div>
          </div>
        </div>
      </div>

      <!-- App Footer -->
      <div class="p-4 bg-slate-950/80 border-t border-slate-800 text-center text-xs text-slate-500">
        Powered by <strong class="text-indigo-400">GrowBot Telegram Mini App Engine</strong>
      </div>
    </div>
  </div>
</template>
