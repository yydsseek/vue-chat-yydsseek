import { useLocalStorage } from '@vueuse/core';
import { computed } from 'vue';
import { defineStore } from 'pinia';

interface ChatSettingsState {
  isDeepThinking: boolean;
  onlineSearch: 'none' | 'simple' | 'deep';
  providerStrategy: 'auto' | 'speed' | 'price';
  notskip: boolean;
}

export const useChatSettingsStore = defineStore('chatSettings', () => {
  const defaultSettings: ChatSettingsState = {
    isDeepThinking: false,
    onlineSearch: 'none',
    providerStrategy: 'auto',
    notskip: false,
  };

  // State
  const settings = useLocalStorage<ChatSettingsState>('chat:settings', defaultSettings);

  // Computed
  const isDeepThinking = computed(() => settings.value.isDeepThinking);
  const onlineSearch = computed(() => settings.value.onlineSearch);
  const providerStrategy = computed(() => settings.value.providerStrategy);
  const notskip = computed(() => settings.value.notskip);
  // Actions
  function setDeepThinking(value: boolean): void {
    settings.value.isDeepThinking = value;
  }

  function setOnlineSearch(value: 'none' | 'simple' | 'deep'): void {
    settings.value.onlineSearch = value;
  }

  function setProviderStrategy(value: 'auto' | 'speed' | 'price'): void {
    settings.value.providerStrategy = value;
  }

  function setNotskip(value: boolean): void {
    settings.value.notskip = value;
  }

  function resetSettings(): void {
    settings.value = { ...defaultSettings };
  }

  return {
    isDeepThinking,
    onlineSearch,
    providerStrategy,
    notskip,
    setDeepThinking,
    setOnlineSearch,
    setProviderStrategy,
    setNotskip,
    resetSettings,
  };
});