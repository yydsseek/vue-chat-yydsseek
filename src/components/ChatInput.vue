<script setup lang="ts">
import { useChatStore } from '@/stores/chat';
import { useChatSettingsStore } from '@/stores/chatSettings';
import { ref, computed, onMounted, nextTick } from 'vue';


const props = defineProps<{
  isLoading: boolean;
}>();

const chatSettingsStore = useChatSettingsStore();
const message = ref<string>('');
const messageInput = ref();
const chatStore = useChatStore();
const isMobile = ref(false);


// 检测设备类型
const checkDeviceType = () => {
  isMobile.value = window.innerWidth <= 768;
};

// 使用 store 中的值
const isDeepThinking = computed({
  get: () => chatSettingsStore.isDeepThinking,
  set: (value) => chatSettingsStore.setDeepThinking(value)
});

const onlineSearch = computed({
  get: () => chatSettingsStore.onlineSearch,
  set: (value) => chatSettingsStore.setOnlineSearch(value)
});

const providerStrategy = computed({
  get: () => chatSettingsStore.providerStrategy,
  set: (value) => chatSettingsStore.setProviderStrategy(value)
});

const notskip = computed({
  get: () => chatSettingsStore.notskip,
  set: (value) => chatSettingsStore.setNotskip(value)
});

// Computed properties for validation
const isMessageValid = computed(() => Boolean(message.value.trim()));
const canSubmit = computed(() => isMessageValid.value || props.isLoading);

// Focus helper function
const focusInput = () => {
	if (messageInput.value) {
		messageInput.value?.textarea?.focus();
	}
};

// Focus input on mount and after loading
onMounted(() => {
	checkDeviceType();
	window.addEventListener('resize', checkDeviceType);
	focusInput();
	// Multiple focus attempts to ensure it works across different scenarios
	setTimeout(focusInput, 100);
	nextTick(focusInput);
	setTimeout(focusInput, 500);
});

const emit = defineEmits<{
	submit: [message: string];
	stop: [];
}>();

// 修改按钮点击事件
const handleDeepThinking = () => {
  isDeepThinking.value = !isDeepThinking.value;
};

const handleOnlineSearch = () => {
  onlineSearch.value = onlineSearch.value === 'none' ? 'simple' : 
                      onlineSearch.value === 'simple' ? 'deep' : 'none';
};

const handleProviderStrategy = () => {
  providerStrategy.value = providerStrategy.value === 'auto' ? 'speed' : 
                          providerStrategy.value === 'speed' ? 'price' : 'auto';
};

const handleNotskip = () => {
  notskip.value = !notskip.value;
};

const handleSubmit = () => {
	if (!canSubmit.value) return;

	if (props.isLoading) {
		emit('stop');
		return;
	}
	const userMessage = message.value.trim();
	emit('submit', userMessage);
	message.value = '';

	// Refocus after submission
	nextTick(focusInput);
};

// Expose focusInput method to parent components
defineExpose({
	focus: focusInput,
});

// 添加插入文本的方法
const getStrategyText = (text: string) => {
	return text == 'auto' ? '自动' : text == 'speed' ? '速度优先' : '低价优先';
};

const getOnlineSearchText = (text: string) => {
	return text == 'none' ? '关闭' : text == 'simple' ? '10页' : '50页';
};


</script>

<template>
	<!-- 桌面版输入框 -->
	<div v-if="!isMobile" class="flex justify-center w-full mt-2">
		<div class="flex flex-col w-4/5 gap-2">
			<!-- 添加按钮组 -->
			<div class="flex gap-2">
				<UButton
					:variant="isDeepThinking ? 'solid' : 'outline'"
					color="neutral"
					size="sm"
					class="flex items-center gap-1"
					@click="handleDeepThinking">
					<UIcon name="i-lucide-sparkle" class="w-4 h-4" />
					深度思考 (R1)
				</UButton>
				<UButton
					:variant="onlineSearch !== 'none' ? 'solid' : 'outline'"
					color="neutral"
					size="sm"
					class="flex items-center gap-1"
					@click="handleOnlineSearch">
					<UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4" />
					联网搜索: {{ getOnlineSearchText(onlineSearch) }}
				</UButton>
				<UButton
					variant="outline"
					color="neutral"
					size="sm"
					class="flex items-center gap-1"
					@click="handleProviderStrategy">
					<UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
					节点策略: {{ getStrategyText(providerStrategy) }}
				</UButton>
			</div>
			
			<!-- 原有的输入框 -->
			<div class="flex gap-1 px-2 border bg-[var(--ui-bg-elevated)] border-[var(--ui-border-muted)] rounded-xl transition-shadow shadow-lg shadow-white/2">
				<div class="flex-1">
					<UTextarea
						ref="messageInput"
						v-model="message"
						size="base"
						variant="ghost"
						placeholder="输入您的问题"
						class="w-full min-h-16 py-1.5 [&_textarea]:resize-none [&_textarea]:min-h-16 [&_textarea]:text-base"
						:disabled="isLoading"
						:rows="1"
						:maxrows="12"
						autofocus
						@keydown.enter.exact.prevent="handleSubmit" />
				</div>
				<div class="flex items-end py-1.5">
					<UTooltip
						:text="
							!isMessageValid ? 'Please enter a message' : ''
						"
						:disabled="canSubmit">
						<UButton
							variant="ghost"
							color="primary"
							size="lg"
							:disabled="!canSubmit"
							@click="handleSubmit">
							<template v-if="isLoading">
								<UIcon name="i-heroicons-stop-solid" class="w-6 h-6" />
							</template>
							<template v-else>
								<UIcon name="i-heroicons-paper-airplane-solid" class="w-6 h-6 -rotate-45" />
							</template>
						</UButton>
					</UTooltip>
				</div>
			</div>
		</div>
	</div>

	<!-- 手机版输入框 -->
	<div v-else class="w-full px-2 py-2 bg-[var(--ui-bg)] sticky bottom-0 z-10">
		<!-- 选项面板 (始终显示) -->
		<div class="flex flex-wrap items-center justify-between gap-1 mb-2 p-2]">
			<div class="flex flex-wrap gap-1">
				<UButton
					:variant="isDeepThinking ? 'solid' : 'outline'"
					color="neutral"
					size="md"
					class="flex items-center gap-1"
					@click="handleDeepThinking">
					<UIcon name="i-lucide-sparkle" class="w-3 h-3" />
					深度思考
				</UButton>
				<UButton
					:variant="onlineSearch !== 'none' ? 'solid' : 'outline'"
					color="neutral"
					size="md"
					class="flex items-center gap-1"
					@click="handleOnlineSearch">
					<UIcon name="i-heroicons-magnifying-glass" class="w-3 h-3" />
					联网搜索: {{ getOnlineSearchText(onlineSearch) }}
				</UButton>
				<UButton
					variant="outline"
					color="neutral"
					size="md"
					class="flex items-center gap-1"
					@click="handleProviderStrategy">
					<UIcon name="i-heroicons-arrow-path" class="w-3 h-3" />
					{{ getStrategyText(providerStrategy) }}
				</UButton>
			</div>

			<UButton
			  @click="emit('new-chat')"
        color="neutral"
        variant="ghost"
        size="lg"
        icon="i-heroicons-plus" 
        class="cursor-pointer">
      </UButton>
		</div>
		
		<!-- 手机版输入框 -->
		<div class="flex gap-1 px-2 border bg-[var(--ui-bg-elevated)] border-[var(--ui-border-muted)] rounded-xl shadow-md">
			<div class="flex-1">
				<UTextarea
					ref="messageInput"
					v-model="message"
					size="sm"
					variant="ghost"
					placeholder="输入您的问题"
					class="w-full py-1 [&_textarea]:resize-none [&_textarea]:text-sm"
					:disabled="isLoading"
					:rows="1"
					:maxrows="4"
					autofocus
					@keydown.enter.exact.prevent="handleSubmit" />
			</div>
			<div class="flex items-end py-1">
				<UButton
					variant="ghost"
					color="primary"
					size="md"
					:disabled="!canSubmit"
					@click="handleSubmit">
					<template v-if="isLoading">
						<UIcon name="i-heroicons-stop-solid" class="w-5 h-5" />
					</template>
					<template v-else>
						<UIcon name="i-heroicons-paper-airplane-solid" class="w-5 h-5 -rotate-45" />
					</template>
				</UButton>
			</div>
		</div>
	</div>
</template>
