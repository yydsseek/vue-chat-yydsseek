<template>
	<ChatBaseLayout :auto-scroll="true">
		<template #sidebar>
			<ChatSidebar />
		</template>

		<!-- <ChatNew />  -->
		<template #default>
			<ChatDisplay :messages="chatStore.messages" @retry="handleRetry" />
		</template>

		<template #footer>
			<ChatInput ref="chatInput" :is-loading="isLoading" @submit="handleSubmit" @stop="handleStop"
				@new-chat="handleNewChat" />
		</template>
	</ChatBaseLayout>

</template>

<script setup lang="ts">


import { ref, nextTick, onMounted } from 'vue';
import OpenAI from 'openai';
import ChatBaseLayout from './ChatBaseLayout.vue';
import ChatDisplay from './ChatDisplay.vue';
import ChatInput from './ChatInput.vue';
import ChatSidebar from './ChatSidebar.vue';
import { type ChatMessage, useChatStore } from '../stores/chat';
import { useChatSettingsStore } from '../stores/chatSettings';

const isLoading = ref(false);
const chatInput = ref();
const chatSettingsStore = useChatSettingsStore();


// 修改 getModelString 函数
const getModelString = () => {
    if (import.meta.env.VITE_API_BASE_URL != "https://yydsseek.com/api/v1"){
        return import.meta.env.VITE_API_MODEL;
    }
    
	let model = chatSettingsStore.isDeepThinking ? 'deepseek-r1' : 'deepseek-v3';
	if (chatSettingsStore.providerStrategy != 'auto') {
		model += ':' + chatSettingsStore.providerStrategy;
	}
	if (chatSettingsStore.onlineSearch == 'simple') {
		model += '|search:10';
	} else if (chatSettingsStore.onlineSearch == 'deep') {
		model += '|search:50';
	}
	model += '|notskip';
	return model;
}

const isMobile = ref(false);

const chatStore = useChatStore();

const isDev = import.meta.env.DEV;
const openai = new OpenAI({
	apiKey: import.meta.env.VITE_API_KEY,
	baseURL: import.meta.env.VITE_API_BASE_URL,
	dangerouslyAllowBrowser: true,
});

const focusInput = () => nextTick(() => chatInput.value?.focus());


const handleSubmit = async (userInput: string) => {
	if (!userInput.trim() || isLoading.value) return;
	// Add user message with conversationId
	chatStore.addMessage({
		role: 'user' as const,
		content: userInput,
		conversationId: chatStore.currentConversationId || 'default',
		reasoning_content: ''
	});
	await requestChatComplete();
};

const handleStop = () => {
	isLoading.value = false;
}

const handleRetry = async (id: string) => {
	await chatStore.removeMessage(id);
	await requestChatComplete();
}


// Modify requestChatComplete to use the initialized encoder
const requestChatComplete = async () => {
	let assistantMessage: ChatMessage | null = null;
	let intervalId: NodeJS.Timeout | null = null;
	try {
		isLoading.value = true;
		let currentResponse = '';
		let reasoning_content = '';


		const startTime = Date.now();
		let firstResponseTime = 0;
		let outputTokens = 0;

		// 创建助手消息
		assistantMessage = await chatStore.addMessage({
			role: 'assistant' as const,
			content: '',
			conversationId: chatStore.currentConversationId || 'default',
			reasoning_content: '',
			inputTokens: 0,
			outputTokens: 0,
			firstResponseTime: 0,
			speed: 0
		});

		intervalId = setInterval(() => {  // 移除 async
			if (assistantMessage) {
				const currentDots = assistantMessage.reasoning_content;  // 移除可选链操作符
				const nextDots = currentDots === '..' ? '.' : currentDots + '.';
				assistantMessage.reasoning_content = nextDots;  // 直接更新 content
				// 触发响应式更新
				chatStore.messages = [...chatStore.messages];
			}
		}, 500);

		const { data, response } = await openai.chat.completions.create({
			model: getModelString(),
			messages: chatStore.messages.filter(message => message.content.length > 0).map(message => ({
				role: message.role,
				content: message.content
			})),
			stream: true,
		}).withResponse();

		clearInterval(intervalId);
		assistantMessage.reasoning_content = '';

		// 浏览器端解码示例
		const encodedProviderName = response.headers.get('x-yydsseek-provider');
		const providerName = encodedProviderName ? decodeURIComponent(encodedProviderName) : '';
		const encodedModelName = response.headers.get('x-yydsseek-model');
		const modelName = encodedModelName ? decodeURIComponent(encodedModelName) : '';
		assistantMessage.provider = providerName;
		assistantMessage.model = modelName;

		// Process the stream
		for await (const chunk of data) {
			if (!firstResponseTime) {
				firstResponseTime = Date.now() - startTime;
				if (assistantMessage) {
					assistantMessage.firstResponseTime = firstResponseTime;
				}
			}

			if (chunk.choices[0]?.delta?.reasoning_content) {
				reasoning_content += chunk.choices[0].delta.reasoning_content;
				if (assistantMessage) {
					assistantMessage.reasoning_content = reasoning_content;
					await chatStore.updateLastMessage(assistantMessage);
				}
			}

			if (chunk.choices[0]?.delta?.content) {
				currentResponse += chunk.choices[0].delta.content;
				if (assistantMessage) {
					assistantMessage.content = currentResponse;
					await chatStore.updateLastMessage(assistantMessage);
				}
			}

			if (chunk.usage) {
				assistantMessage.inputTokens = chunk.usage.prompt_tokens;
				assistantMessage.outputTokens = chunk.usage.completion_tokens;

				const elapsedTime = Math.max((Date.now() - startTime) / 1000, 0.1); // 避免除以0
				assistantMessage.speed = chunk.usage.completion_tokens / elapsedTime;
				await chatStore.updateLastMessage(assistantMessage);
			}

			if (!isLoading.value) {
				break;
			}
		}
		// 释放编码器    
	} catch (error) {
		console.error('Chat error:', error);
		assistantMessage!.content = '抱歉,网络请求失败';
		await chatStore.updateLastMessage(assistantMessage);
		if (intervalId) {
			clearInterval(intervalId);
		}
	} finally {
		isLoading.value = false;
		focusInput();
	}
}

// 检测设备类型
const checkDeviceType = () => {
	isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
	checkDeviceType();
	window.addEventListener('resize', checkDeviceType);
});

const handleNewChat = () => {
	const recentConversation = chatStore.conversations[0];
	if (recentConversation?.title === '') {
		chatStore.currentConversationId = recentConversation.id;
		chatStore.loadMessages(recentConversation.id);
		return;
	}
	chatStore.createConversation();
};

</script>




<style scoped>
:root {
	--safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
}

/* 然后在需要考虑安全区域的元素上使用这个变量 */
</style>
