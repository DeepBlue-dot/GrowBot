import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import CampaignsView from '../views/CampaignsView.vue';
import LeaderboardView from '../views/LeaderboardView.vue';
import RewardsView from '../views/RewardsView.vue';
import MiniAppView from '../views/MiniAppView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/campaigns',
      name: 'campaigns',
      component: CampaignsView,
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: LeaderboardView,
    },
    {
      path: '/rewards',
      name: 'rewards',
      component: RewardsView,
    },
    {
      path: '/miniapp',
      name: 'miniapp',
      component: MiniAppView,
    },
  ],
});

export default router;
