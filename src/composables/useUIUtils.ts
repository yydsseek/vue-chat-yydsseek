import { computed } from 'vue';

export function useUIUtils() {
  const radiusClasses = computed(() => ({
    value: 'rounded-lg'
  }));

  return {
    radiusClasses
  };
} 