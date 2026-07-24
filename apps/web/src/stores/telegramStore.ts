import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export const useTelegramStore = defineStore('telegram', () => {
  const initDataRaw = ref<string>('');
  const user = ref<TelegramUser | null>(null);
  const isMiniApp = ref<boolean>(false);
  const startParam = ref<string>('ref_DEMO123');

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
    referralLink,
    initTelegramSDK,
  };
});
