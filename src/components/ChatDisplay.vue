<script setup lang="ts">
import type { ChatMessage } from '../stores/chat';
import { useUIUtils } from '../composables/useUIUtils';
import MarkdownRenderer from './MarkdownRenderer.vue';
import { ref, onMounted } from 'vue';

interface Props {
	messages: ChatMessage[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
	retry: [id: string];
}>();

const { radiusClasses } = useUIUtils();

const getRoleIcon = (role: ChatMessage['role']) => (role === 'assistant' ? 'i-heroicons-sparkles' : 'i-heroicons-user');

// 检测设备类型
const isMobile = ref(false);

const checkDeviceType = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  checkDeviceType();
  window.addEventListener('resize', checkDeviceType);
});

//bg-[var(--ui-bg-muted)]
const getMessageClasses = (role: ChatMessage['role']) => ({
	container: ['gap-2', role === 'user' ? 'flex-row-reverse' : 'flex-row'],
	avatar: [
		'mt-0.5',
		role === 'user' ? 'bg-[var(--ui-bg-accented)]' : 'bg-transparent border border-[var(--ui-border)]',
		radiusClasses,
	],
	message: [
		isMobile.value ? 'max-w-[85%]' : 'max-w-[90%]', 
		'py-2 px-3',
		role === 'user' ? `rounded-lg rounded-tr-none` : `rounded-lg rounded-tl-none`,
		role === 'user'
			? 'bg-[var(--ui-bg-accented)] text-[var(--ui-text-highlighted)]'
			: 'text-[var(--ui-text)]',
	],
});

const handleCopy = (content: string) => {
	navigator.clipboard.writeText(content);
};

const retry = (id: string) => {
	emit('retry', id);
};

const hoveredMessageId = ref<string | null>(null);

</script>

<template>
	<!-- 桌面版聊天显示 -->
	<div v-if="!isMobile" class="flex flex-col gap-2 px-2 pt-2 pb-20">
		<article
			v-for="message in messages"
			:key="message.id"
			class="flex"
			:class="getMessageClasses(message.role).container">
			<UAvatar
				class="!rounded-full shrink-0"
				:icon="getRoleIcon(message.role)"
				:ui="{
					icon: 'text-[var(--ui-text-muted)]',
				}"
				v-if="message.role != 'user'"
				:class="getMessageClasses(message.role).avatar" />
			<div :class="getMessageClasses(message.role).message" @mouseenter="hoveredMessageId = message.id" @mouseleave="hoveredMessageId = null">
				<div v-if="message.reasoning_content" class="reasoning_content mb-3">
					> {{ message.reasoning_content }}
				</div>
				<template v-if="message.role != 'user'">
				<MarkdownRenderer :content="message.content" />
				<div :class="{ 'invisible': hoveredMessageId !== message.id }">
					<UTooltip text="复制内容">
						<UButton variant="ghost" color="neutral" size="sm" class="mr-1 my-2 cursor-pointer" @click="handleCopy(message.content)" >
							<UIcon name="i-lucide-copy" class="size-5" />
						</UButton>
					</UTooltip>
					<UTooltip text="重新生成">
						<UButton variant="ghost" color="neutral" size="sm" class="cursor-pointer" @click="retry(message.id)" title="Retry response">
							<UIcon name="i-lucide-rotate-cw" class="size-5" />
						</UButton>
					</UTooltip>
          <UPopover mode="hover" :content="{
                align: 'center',
                side: 'right',
                sideOffset: 8
              }">
              <UButton variant="ghost" color="neutral" size="sm" class="cursor-pointer">
                <UIcon name="i-lucide-chart-column" class="size-5" />
              </UButton>  
            <template #content>
              <div class="text-xs space-y-1 px-2 py-2 bg-(--ui-bg-elevated) border-[var(--ui-border-muted)] border rounded-md" >
                <div>模型: {{ message.model || '-' }}</div>
                <div>服务方: {{ message.provider || '-' }}</div>
                <div>输入: {{ message.inputTokens || '-' }} tokens</div>
                <div>输出: {{ message.outputTokens || '-' }} tokens</div>
                <div>首次响应: {{ (message.firstResponseTime || 0) / 1000 }}s</div>
                <div>生成速度: {{ message.speed?.toFixed(1) || '-' }} t/s</div>
              </div>
            </template>
          </UPopover>
				</div>
				</template>
				<template v-else>
					{{ message.content }}
				</template>
			</div>
		</article>
	</div>

	<!-- 手机版聊天显示 -->
	<div v-else class="flex flex-col gap-2 px-1 pt-2 pb-20">
		<article
			v-for="message in messages"
			:key="message.id"
			class="flex"
			:class="getMessageClasses(message.role).container">
			<UAvatar
				v-if="message.role != 'user'"
				class="!rounded-full shrink-0 size-10"
				:icon="getRoleIcon(message.role)"
				:ui="{
					icon: 'text-[var(--ui-text-muted)] size-5',
				}"
				:class="getMessageClasses(message.role).avatar" />
			<div :class="getMessageClasses(message.role).message" @click="hoveredMessageId = hoveredMessageId === message.id ? null : message.id">
				<div v-if="message.reasoning_content" class="reasoning_content mb-2 text-sm">
					> {{ message.reasoning_content }}
				</div>
				<template v-if="message.role != 'user'">
					<MarkdownRenderer :content="message.content" class="mobile-markdown" />
					<div v-if="hoveredMessageId === message.id" class="flex mt-2 border-t border-[var(--ui-border-muted)] pt-2">
						<UButton variant="ghost" color="neutral" size="sm" class="mr-2 cursor-pointer" @click="handleCopy(message.content)">
							<UIcon name="i-lucide-copy" class="size-5 mr-1" />
							复制
						</UButton>
						<UButton variant="ghost" color="neutral" size="sm" class="cursor-pointer" @click="retry(message.id)">
							<UIcon name="i-lucide-rotate-cw" class="size-5 mr-1" />
							重新生成
						</UButton>
					</div>
				</template>
				<template v-else>
					<div class="text-base">{{ message.content }}</div>
				</template>
			</div>
		</article>
	</div>
</template>


<style scoped>
.markdown-body :deep(think) {
	color: var(--ui-text-muted);
	font-size: smaller;
	display: block;
}

.reasoning_content{
	border-left: 0.5px solid var(--ui-text-muted);
	color: var(--ui-text-muted);
	font-size: smaller;
	display: block;
	margin: 1rem 0;
	padding-left: 0.5rem;
}

.mobile-markdown :deep {
  font-size: 16px;
  line-height: 1.4;
}

.mobile-markdown :deep h1 { font-size: 1.3em; }
.mobile-markdown :deep h2 { font-size: 1.15em; }
.mobile-markdown :deep h3 { font-size: 1.05em; }

.mobile-markdown :deep pre {
  font-size: 14px;
  padding: 0.4em;
  margin: 0.4em 0;
  overflow-x: auto;
}

.markdown-body :deep{
  /* 基础样式 */
  color: var(--ui-text);
  font-size: 16px;
  line-height: 1.4;
  

  h1, h2, h3, h4{
    margin-top: 24px;
    margin-bottom: 16px;
    line-height: 1.6;
  }

  /* 标题样式 */
  h5, h6 {
    margin-top: 16px;
    margin-bottom: 8px;
    font-weight: 600;
    line-height: 1.4;
	  color: var(--ui-text);
}
  
  h1 { font-size: 1.5em; }
  h2 { font-size: 1.25em; }
  h3 { font-size: 1.1em; }
  
  /* 段落样式 */
  /* p {
    margin-bottom: 16px;
  } */
  
  /* 链接样式 */
  a {
    color: var(--tw-prose-links);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
  
  hr{
    margin: 1.0em 0;
    color: var(--ui-color-neutral-500);
  }
  /* 代码块样式 */
  pre {
    border-radius: 8px;
    padding: 0.5em;
    margin: 0.5em 0;
    overflow-x: auto;
  }
  
  pre code {
    padding: 0;
    border-radius: 0;
    font-family: 'JetBrains Mono', SFMono-Regular, Consolas, Menlo, monospace;
    font-size: 0.85em;
    line-height: 1.25;
  }
  
  /* 行内代码样式 */
  :not(pre) > code {
    background-color: rgba(175, 184, 193, 0.2);
    border-radius: 4px;
    font-size: 0.9em;
    padding: 0.2em 0.4em;
    font-family: 'JetBrains Mono', SFMono-Regular, Consolas, Menlo, monospace;
  }
  
  /* 列表样式优化 */
  ul, ol {
    padding-left: 1.2em;
    margin: 1.0em 0;
  }
  
  li {
    margin: 0.4em 0;
    line-height: 1.4;
    display: list-item;
  }

  li::marker {
    color: var(--tw-prose-bullets);
    font-size: 1.0em;
  }
}
</style>
