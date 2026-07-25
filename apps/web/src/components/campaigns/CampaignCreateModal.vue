<script setup lang="ts">
import { ref } from 'vue';
import { useCampaignStore } from '../../stores/campaignStore';
import { X, Plus, Rocket } from 'lucide-vue-next';

const emit = defineEmits(['close']);
const campaignStore = useCampaignStore();

const title = ref('');
const description = ref('');
const type = ref<'MILESTONE' | 'LEADERBOARD'>('MILESTONE');
const targetReferrals = ref(5);
const rewardTitle = ref('');
const startDate = ref(new Date().toISOString().split('T')[0]);
const endDate = ref('');
const ruleType = ref<'IMMEDIATE' | 'TIME_BOUND' | 'MESSAGE_COUNT'>('IMMEDIATE');
const minStayHours = ref(24);
const minMessages = ref(3);
const submitting = ref(false);

async function submitForm() {
  if (!title.value || !rewardTitle.value) return;
  submitting.value = true;

  await campaignStore.createCampaign({
    title: title.value,
    description: description.value,
    type: type.value,
    targetReferrals: targetReferrals.value,
    rewardTitle: rewardTitle.value,
    rewardDescription: rewardTitle.value,
    startDate: startDate.value,
    endDate: endDate.value || undefined,
    rules: [
      {
        id: `r-${Date.now()}`,
        type: ruleType.value,
        minStayHours: ruleType.value === 'TIME_BOUND' ? minStayHours.value : undefined,
        minMessages: ruleType.value === 'MESSAGE_COUNT' ? minMessages.value : undefined,
      },
    ],
  });

  submitting.value = false;
  emit('close');
}
</script>

<template>
  <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
    <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Rocket class="w-5 h-5" />
          </div>
          <h2 class="text-lg font-bold text-slate-100">Create Growth Campaign</h2>
        </div>
        <button @click="$emit('close')" class="p-2 rounded-xl hover:bg-slate-800 text-slate-400 cursor-pointer">
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="submitForm" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-300 mb-1">Campaign Title *</label>
          <input
            v-model="title"
            required
            type="text"
            placeholder="e.g. Summer Growth Sprint 🚀"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="block font-semibold text-slate-300 mb-1">Description</label>
          <textarea
            v-model="description"
            rows="2"
            placeholder="Explain campaign rules & rewards to community members"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Campaign Type</label>
            <select
              v-model="type"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="MILESTONE">MILESTONE (Target Invites)</option>
              <option value="LEADERBOARD">LEADERBOARD (Top Ranking)</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Referral Target</label>
            <input
              v-model.number="targetReferrals"
              type="number"
              min="1"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-300 mb-1">Reward Title *</label>
          <input
            v-model="rewardTitle"
            required
            type="text"
            placeholder="e.g. VIP Badge + Private Channel Pass"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Validation Rule</label>
            <select
              v-model="ruleType"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="IMMEDIATE">IMMEDIATE (On Join)</option>
              <option value="TIME_BOUND">TIME_BOUND (Min Stay Hours)</option>
              <option value="MESSAGE_COUNT">MESSAGE_COUNT (Min Group Messages)</option>
            </select>
          </div>

          <div v-if="ruleType === 'TIME_BOUND'">
            <label class="block font-semibold text-slate-300 mb-1">Min Stay Hours</label>
            <input
              v-model.number="minStayHours"
              type="number"
              min="1"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div v-if="ruleType === 'MESSAGE_COUNT'">
            <label class="block font-semibold text-slate-300 mb-1">Min Messages</label>
            <input
              v-model.number="minMessages"
              type="number"
              min="1"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <Plus class="w-4 h-4" />
            <span>{{ submitting ? 'Launching...' : 'Launch Campaign' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
