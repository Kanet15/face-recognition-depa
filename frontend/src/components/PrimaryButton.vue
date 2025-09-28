<template>
  <button
    :type="type"
    :class="['inline-flex items-center justify-center gap-2 font-semibold rounded-xl shadow-md focus:outline-none', sizeClass, colorClass, disabled ? 'opacity-60 cursor-not-allowed' : '']"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false }
});

const sizeClass = computed(() => {
  return props.size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm';
});

const colorClass = computed(() => {
  if (props.variant === 'primary') return 'bg-blue-600 text-white hover:bg-blue-700';
  if (props.variant === 'danger') return 'bg-red-600 text-white hover:bg-red-700';
  return 'bg-gray-200 text-gray-800 hover:bg-gray-300';
});
</script>

<style scoped>
/* Small shadow adjustment for consistent look */
.shadow-md { box-shadow: 0 6px 18px -8px rgba(16,24,40,0.2); }
</style>
