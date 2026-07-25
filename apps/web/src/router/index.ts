import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import CampaignsView from '../views/CampaignsView.vue';
import LeaderboardView from '../views/LeaderboardView.vue';
import RewardsView from '../views/RewardsView.vue';
import MiniAppView from '../views/MiniAppView.vue';
import LoginView from '../views/LoginView.vue';
import { useAuthStore } from '../stores/authStore';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/campaigns',
      name: 'campaigns',
      component: CampaignsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: LeaderboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/rewards',
      name: 'rewards',
      component: RewardsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/miniapp',
      name: 'miniapp',
      component: MiniAppView,
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router;
