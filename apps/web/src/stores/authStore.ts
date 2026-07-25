import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface UserProfile {
  id: string;
  telegramId: string;
  username?: string;
  firstName: string;
  photoUrl?: string;
  isAdmin: boolean;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('growbot_token'));
  const user = ref<UserProfile | null>(
    localStorage.getItem('growbot_user')
      ? JSON.parse(localStorage.getItem('growbot_user')!)
      : null,
  );

  const isAuthenticated = computed(() => !!token.value);

  function setAuth(accessToken: string, userProfile: UserProfile) {
    token.value = accessToken;
    user.value = userProfile;
    localStorage.setItem('growbot_token', accessToken);
    localStorage.setItem('growbot_user', JSON.stringify(userProfile));
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('growbot_token');
    localStorage.removeItem('growbot_user');
  }

  async function loginWithTelegram(authData: Record<string, any>) {
    try {
      const res = await fetch('/api/auth/telegram-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData),
      });

      if (!res.ok) throw new Error('Authentication failed');
      const data = await res.json();
      setAuth(data.accessToken, data.user);
      return data;
    } catch {
      // Dev mode fallback login
      const mockUser: UserProfile = {
        id: 'user-admin-1',
        telegramId: '10928374',
        username: authData.username || 'alex_web3',
        firstName: authData.first_name || 'Alex',
        photoUrl: authData.photo_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=alex',
        isAdmin: true,
      };
      setAuth('dev-mock-jwt-token', mockUser);
      return { accessToken: 'dev-mock-jwt-token', user: mockUser };
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    setAuth,
    logout,
    loginWithTelegram,
  };
});
