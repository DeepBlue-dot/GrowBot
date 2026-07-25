import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export interface MyCampaignItem {
  participantId: string;
  campaignId: string;
  title: string;
  communityTitle: string;
  referralCode: string;
  validatedReferrals: number;
  totalReferrals: number;
  targetReferrals: number;
  rewardTitle: string;
  status: string;
}

export const useTelegramStore = defineStore('telegram', () => {
  const initDataRaw = ref<string>('');
  const user = ref<TelegramUser | null>(null);
  const isMiniApp = ref<boolean>(false);
  const startParam = ref<string>('ref_DEMO123');
  const myCampaigns = ref<MyCampaignItem[]>([]);
  const jwtToken = ref<string | null>(localStorage.getItem('growbot_miniapp_token'));
  const intentRegistered = ref<boolean>(false);

  async function authenticateMiniApp() {
    if (!initDataRaw.value) return;
    try {
      const res = await api.post<{ accessToken: string }>('/auth/telegram-miniapp', {
        initDataRaw: initDataRaw.value,
      });
      if (res.data?.accessToken) {
        jwtToken.value = res.data.accessToken;
        localStorage.setItem('growbot_miniapp_token', res.data.accessToken);
      }
    } catch {
      // Dev mode fallback
    }
  }

  function initTelegramSDK() {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      isMiniApp.value = true;
      initDataRaw.value = tg.initData || '';

      if (tg.initDataUnsafe?.user) {
        user.value = tg.initDataUnsafe.user;
      }

      if (tg.initDataUnsafe?.start_param) {
        startParam.value = tg.initDataUnsafe.start_param;
      }

      void authenticateMiniApp();
    } else {
      // Mock fallback user for web browser development
      user.value = {
        id: 987654321,
        first_name: 'Alex',
        last_name: 'Dev',
        username: 'alex_web3',
        photo_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex',
      };
    }

    void fetchMyCampaigns();
  }

  async function registerReferralIntent(communityChatId = '-100123456789') {
    const referrerCode = startParam.value.replace('ref_', '') || 'alex_web3';
    const inviteeId = String(user.value?.id || '987654321');

    try {
      await api.post('/referral/intent', {
        referrerCode,
        inviteeId,
        communityChatId,
      });
      intentRegistered.value = true;
    } catch {
      intentRegistered.value = true;
    }
  }

  async function joinCampaign(campaignId: string) {
    const inviteeId = String(user.value?.id || '987654321');
    try {
      const res = await api.post(`/campaigns/${campaignId}/join`, {
        userId: inviteeId,
      });
      await fetchMyCampaigns();
      return res.data;
    } catch {
      await fetchMyCampaigns();
      return null;
    }
  }

  async function fetchMyCampaigns() {
    const inviteeId = String(user.value?.id || '987654321');
    try {
      const res = await api.get<MyCampaignItem[]>(`/me/campaigns?userId=${inviteeId}`);
      if (res.data) {
        myCampaigns.value = res.data;
      }
    } catch {
      // Keep state
    }
  }

  const referralLink = computed(() => {
    const code = user.value?.username || `id${user.value?.id || 12345}`;
    return `https://t.me/GrowBotApp/app?startapp=ref_${code}`;
  });

  return {
    initDataRaw,
    user,
    isMiniApp,
    startParam,
    myCampaigns,
    intentRegistered,
    referralLink,
    initTelegramSDK,
    registerReferralIntent,
    joinCampaign,
    fetchMyCampaigns,
  };
});
