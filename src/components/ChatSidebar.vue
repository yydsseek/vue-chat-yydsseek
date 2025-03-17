<template>
  <!-- 桌面版侧边栏 -->
  <div v-if="!isMobile" class="flex flex-col h-full bg-[var(--ui-bg-1)]">
    <!-- 顶部按钮区域 -->
    <div class="p-4 border-[var(--ui-border)]">
      <UButton
        @click="handleNewChat"
        color="neutral"
        variant="outline"
        icon="i-heroicons-plus" 
        class="w-full items-center justify-center h-10 cursor-pointer text-base">
        新建对话
      </UButton>
    </div>

    <!-- 对话列表 -->
    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <div class="px-2 py-2">
        <div
          v-for="chat in chatStore.conversations"
          :key="chat.id"
          :class="[
            'flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer',
            'hover:bg-[var(--ui-bg-accented)] transition-colors',
            chat.id === chatStore.currentConversationId ? 'bg-[var(--ui-bg-elevated)]' : ''
          ]"
          @click="handleSelectChat(chat.id)"
          @mouseenter="hoveredChatId = chat.id"
          @mouseleave="hoveredChatId = null">
          <UIcon name="i-heroicons-chat-bubble-left" class="w-5 h-5 text-[var(--ui-text-2)]" />
          <div class="flex-1 truncate text-[var(--ui-text-1)] text-sm">{{ chat.title === "" ? "新对话" : chat.title }}</div>
          <button
            v-show="hoveredChatId === chat.id"
            @click.stop="handleDeleteChat(chat.id)"
            class="p-1 rounded hover:bg-[var(--ui-bg-3)] cursor-pointer">
            <UIcon name="i-heroicons-trash" class="w-4 h-4 text-[var(--ui-text-2)]" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 手机版侧边栏 -->
  <div v-else class="flex flex-col h-full bg-[var(--ui-bg-1)]">
    <!-- 手机版顶部 -->
    <div class="p-3 border-b border-[var(--ui-border)] flex items-center justify-between">
      <h2 class="text-base font-medium">对话列表</h2>
      <UButton
        @click="handleNewChat"
        color="neutral"
        variant="ghost"
        size="lg"
        icon="i-heroicons-plus" 
        class="cursor-pointer">
      </UButton>
    </div>

    <!-- 手机版对话列表 -->
    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <div class="px-2 py-2">
        <div
          v-for="chat in chatStore.conversations"
          :key="chat.id"
          :class="[
            'flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer',
            'hover:bg-[var(--ui-bg-accented)] transition-colors',
            chat.id === chatStore.currentConversationId ? 'bg-[var(--ui-bg-elevated)]' : ''
          ]"
          @click="handleSelectChat(chat.id)">
          <UIcon name="i-heroicons-chat-bubble-left" class="w-5 h-5 text-[var(--ui-text-2)]" />
          <div class="flex-1 truncate text-[var(--ui-text-1)] text-base">{{ chat.title === "" ? "新对话" : chat.title }}</div>
          <UButton
            @click.stop="handleDeleteChat(chat.id)"
            variant="ghost"
            color="neutral"
            size="sm"
            class="p-1 cursor-pointer">
            <UIcon name="i-heroicons-trash" class="w-4 h-4 text-[var(--ui-text-2)]" />
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useChatStore } from '../stores/chat';
import { useChatSettingsStore } from '../stores/chatSettings';

const chatStore = useChatStore();

const hoveredChatId = ref<string | null>(null);
const isMobile = ref(false);

// 检测设备类型
const checkDeviceType = () => {
  isMobile.value = window.innerWidth <= 768;
};

const handleNewChat = () => {
  const recentConversation = chatStore.conversations[0];
  if (recentConversation.title === '') {
    chatStore.currentConversationId = recentConversation.id;
    chatStore.loadMessages(recentConversation.id);
    return;
  }
  chatStore.createConversation();
}

const handleSelectChat = (id: string) => {
  chatStore.currentConversationId = id
  chatStore.loadMessages(id);
}

const handleDeleteChat = async (id: string) => {
  await chatStore.clearMessages(id);
  await chatStore.loadConversations();
}

onMounted(async () => {
  checkDeviceType();
  window.addEventListener('resize', checkDeviceType);
  await chatStore.loadConversations();
})

</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--ui-bg-elevated);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--ui-bg-elevated);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--ui-bg-elevated);
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--ui-bg-muted) var(--ui-bg);
}
</style> 