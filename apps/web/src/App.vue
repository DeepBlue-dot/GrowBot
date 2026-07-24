<script setup lang="ts">
import Sidebar from './components/layout/Sidebar.vue';
</script>

<template>
  <div class="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
    <Sidebar />
    <div class="flex-1 flex flex-col min-w-0">
      <router-view />
    </div>
  </div>
</template>
