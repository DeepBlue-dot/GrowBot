<script setup lang="ts">
import { ref } from 'vue';
import { useCampaignStore } from '../../stores/campaignStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { X, Plus, Sparkles, ShieldCheck } from 'lucide-vue-next';
import type { CampaignType, ValidationRuleType } from '../../types';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const campaignStore = useCampaignStore();
const workspaceStore = useWorkspaceStore();

const title = ref('');
const description = ref('');
const type = ref<CampaignType>('MILESTONE');
const targetReferrals = ref(5);
const rewardTitle = ref('');
const rewardDescription = ref('');
const validationType = ref<ValidationRuleType>('TIME_BOUND');
const minStayHours = ref(24);
const minMessages = ref(3);

function handleSubmit() {
  if (!title.value || !rewardTitle.value) return;

  campaignStore.createCampaign({
    communityId: workspaceStore.activeCommunities[0]?.id || 'comm-1',
    title: title.value,
    description: description.value,
    type: type.value,
    targetReferrals: Number(targetReferrals.value),
    rewardTitle: rewardTitle.value,
    rewardDescription: rewardDescription.value,
    isActive: true,
    startDate: new Date().toISOString().split('T')[0],
    rules: [
      {
        id: `r-${Date.now()}`,
        type: validationType.value,
        minStayHours: validationType.value === 'TIME_BOUND' ? Number(minStayHours.value) : undefined,
        minMessages: validationType.value === 'MESSAGE_COUNT' ? Number(minMessages.value) : undefined,
      },
    ],
  });

  emit('close');
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-200">
      <button 
        @click="emit('close')"
        class="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
      >
        <X class="w-5 h-5" />
      </button>

      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Sparkles class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-lg font-bold text-slate-100">Create Referral Campaign</h3>
          <p class="text-xs text-slate-400">Configure milestone targets, rewards, and anti-cheat validation.</p>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Campaign Title -->
        <div>
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Campaign Name</label>
          <input 
            v-model="title"
            type="text"
            required
            placeholder="e.g. Summer Growth Sprint 🚀"
            class="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Description</label>
          <textarea 
            v-model="description"
            rows="2"
            placeholder="Describe the rules and benefits for participants..."
            class="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>

        <!-- Campaign Type & Target -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Type</label>
            <select 
              v-model="type"
              class="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="MILESTONE">MILESTONE (Unlock Target)</option>
              <option value="LEADERBOARD">LEADERBOARD (Competition)</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Target Invites</label>
            <input 
              v-model="targetReferrals"
              type="number"
              min="1"
              required
              class="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <!-- Reward Title -->
        <div>
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Reward Title</label>
          <input 
            v-model="rewardTitle"
            type="text"
            required
            placeholder="e.g. VIP Badge + Private Channel Pass"
            class="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <!-- Anti-Cheat Validation Rule -->
        <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <label class="text-xs font-bold text-indigo-400 flex items-center gap-1.5 mb-2">
            <ShieldCheck class="w-4 h-4" />
            Anti-Cheat Verification Criteria
          </label>
          <div class="space-y-3">
            <div>
              <select 
                v-model="validationType"
                class="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TIME_BOUND">TIME_BOUND (Require invitees to stay X hours)</option>
                <option value="MESSAGE_COUNT">MESSAGE_COUNT (Require invitees to send X messages)</option>
                <option value="IMMEDIATE">IMMEDIATE (Validate instantly on join)</option>
              </select>
            </div>

            <div v-if="validationType === 'TIME_BOUND'">
              <label class="text-[11px] text-slate-400 block mb-1">Required Stay Duration (Hours)</label>
              <input 
                v-model="minStayHours"
                type="number"
                min="1"
                class="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100"
              />
            </div>

            <div v-if="validationType === 'MESSAGE_COUNT'">
              <label class="text-[11px] text-slate-400 block mb-1">Minimum Group Messages Required</label>
              <input 
                v-model="minMessages"
                type="number"
                min="1"
                class="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100"
              />
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex items-center justify-end gap-3 pt-2">
          <button 
            type="button" 
            @click="emit('close')"
            class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit"
            class="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>Launch Campaign</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
