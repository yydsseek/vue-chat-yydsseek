<script setup lang="ts">
interface Props {
	/**
	 * Whether to auto scroll to bottom when content changes
	 */
	autoScroll?: boolean;
}

withDefaults(defineProps<Props>(), {
	autoScroll: false,
});

import { ref, onMounted, onUnmounted } from 'vue';
import ScrollArea from './ScrollArea.vue';


// 检测设备类型
const isMobile = ref(false);
const isSidebarOpen = ref(false);

const checkDeviceType = () => {
  isMobile.value = window.innerWidth <= 768;
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// 回到首页
const goToHome = () => {
  window.location.href = '/';
};

// 处理键盘弹出
const isKeyboardVisible = ref(false);

onMounted(() => {
  checkDeviceType();
  window.addEventListener('resize', checkDeviceType);
  // 检测键盘弹出（iOS）
  window.addEventListener('resize', () => {
    // 如果视窗高度明显减小，可能是键盘弹出
    isKeyboardVisible.value = window.innerHeight < window.outerHeight * 0.75;
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', () => {});
});
</script>

<template>
	<!-- 桌面版布局 -->
	<div v-if="!isMobile" class="flex w-full h-[calc(100dvh-60px)]">
		<!-- 左侧边栏 -->
		<aside class="flex-none w-64 border-r border-[var(--ui-border)]">
			<slot name="sidebar" />
		</aside>

		<!-- 主内容区域 -->
		<div class="flex-1 flex flex-col ml-10 mr-20 my-5">
			<header class="flex-none">
				<slot name="header" />
			</header>
			<main class="flex-1 min-h-0 overflow-hidden w-9/10 mx-auto">
				<div class="flex flex-col h-full mr-12">
					<ScrollArea
						class="flex-1"
						:auto-scroll="autoScroll">
						<div class="pl-1 pr-3">
							<slot />
						</div>
					</ScrollArea>
				</div>
			</main>
			<footer class="flex-none">
				<slot name="footer" />
			</footer>
		</div>
	</div>

	<!-- 手机版布局 -->
	<div v-else class="flex flex-col w-full h-[calc(100dvh)]">
		<!-- 手机版顶部导航栏 -->
		<div class="flex items-center justify-between p-2 border-b border-[var(--ui-border)]">
			<UButton variant="ghost" @click="toggleSidebar">
				<UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
			</UButton>
			<h1 class="text-lg font-medium">YYDS Seek</h1>
			<UButton variant="ghost" @click="goToHome">
				<UIcon name="i-heroicons-home" class="w-6 h-6" />
			</UButton>
		</div>

		<!-- 手机版侧边栏 (可滑动) -->
		<div v-if="isSidebarOpen" class="fixed inset-0 z-50" @click="toggleSidebar">
			<div 
				class="absolute top-0 left-0 h-full w-3/4 max-w-xs bg-[var(--ui-bg)] shadow-lg transform transition-transform duration-300 ease-in-out" 
				:class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
				@click.stop>
				<slot name="sidebar" />
			</div>
		</div>

		<!-- 手机版主内容区域 -->
		<main class="flex-1 overflow-hidden">
			<ScrollArea class="h-full" :auto-scroll="autoScroll">
				<div class="px-3 py-2">
					<slot />
				</div>
			</ScrollArea>
		</main>

		<!-- 手机版底部 -->
		<footer class="border-t border-[var(--ui-border)] bg-[var(--ui-bg)]">
			<slot name="footer" />
		</footer>
	</div>
</template>
