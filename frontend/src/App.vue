<template>
  <Navbar v-if="showNavbar" />
  <router-view />
</template>

<script setup>
import Navbar from './components/Navbar.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// Hide the Navbar on the login route/path
const showNavbar = computed(() => {
  const name = route.name;
  const path = route.path;
  return !(name === 'login' || path === '/login');
});

// ...existing code...
</script>