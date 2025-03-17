<script setup lang="ts">
import '@/style/markdown.css'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import { computed, ref, watch } from 'vue'
import mk from "@vscode/markdown-it-katex";
import mf from "markdown-it-footnote"
import multiMdTable from 'markdown-it-multimd-table'
import "katex/dist/katex.min.css";
import { useColorMode } from '@vueuse/core'
import "katex/dist/katex.min.css"; // 确保样式正确加载

// 导入亮色和暗色主题
import 'highlight.js/styles/github.css' // 亮色主题
import 'highlight.js/styles/github-dark.css' // 暗色主题
// 可选的其他主题样式
import 'highlight.js/styles/atom-one-light.css'
import 'highlight.js/styles/atom-one-dark.css'
import 'highlight.js/styles/vs.css'
import 'highlight.js/styles/vs2015.css'

interface Props {
  content: string
  class?: string
}

const props = defineProps<Props>()

// 初始化 markdown-it 并配置
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (__) {}
    }
    return ''
  }
})
.use(mk)
.use(mf)
.use(multiMdTable, {
  multiline: true,
  rowspan: true,
  headerless: false,
  multibody: true,
  aotolabel: true
})

// 添加自定义标签预处理
const customTagProcessor = (content: string) => {
  // 先将 markdown 中的 <think> 标签内容提取出来
  const thinkBlocks = new Map<string, string>();
  let processedContent = content;
  
  // 使用占位符替换 think 标签内容
  processedContent = content.replace(/<think>([\s\S]*?)<\/think>/g, (match, innerContent, index) => {
    const placeholder = `THINK_BLOCK_${index}`;
    thinkBlocks.set(placeholder, innerContent);
    return placeholder;
  });

  // 先让 markdown-it 处理其他内容
  let result = md.render(processedContent);

  // 最后替换回 think 标签
  thinkBlocks.forEach((content, placeholder) => {
    // 处理 think 块内的内容，但保持段落完整性
    const processedThinkContent = md.render(content);
    result = result.replace(placeholder, `<div class="think-block">${processedThinkContent}</div>`);
  });

  return result;
};

// 修改 renderedContent computed 属性
const renderedContent = computed(() => {
  return customTagProcessor(props.content);
});

// 定义主题映射
const codeThemes = {
  light: {
    github: 'github',
    atom: 'atom-one-light',
    vs: 'vs'
  },
  dark: {
    github: 'github-dark',
    atom: 'atom-one-dark',
    vs: 'vs2015'
  }
} as const

// 添加 import

// 使用 VueUse 的 useColorMode 来监听主题变化
const colorMode = useColorMode()
// const colorMode = computed(() => colorMode ? 'dark' : 'light')
const currentTheme = ref('atom') // 添加这行，保持默认主题设置

// 修改 watch 逻辑
watch(() => colorMode.value, (newMode) => {
  const themeSet = newMode === 'dark' ? codeThemes.dark : codeThemes.light
  document.documentElement.setAttribute('data-code-theme', themeSet[currentTheme.value as keyof typeof codeThemes.light])
}, { immediate: true })


</script>

<template>
  <div class="markdown-body" :class="class" v-html="renderedContent"></div>
</template>

<style>
/* 隐藏所有代码主题样式 */
[data-code-theme="github"] .markdown-body pre { --hljs-theme: 'github'; }
[data-code-theme="github-dark"] .markdown-body pre { --hljs-theme: 'github-dark'; }
[data-code-theme="atom-one-light"] .markdown-body pre { --hljs-theme: 'atom-one-light'; }
[data-code-theme="atom-one-dark"] .markdown-body pre { --hljs-theme: 'atom-one-dark'; }
[data-code-theme="vs"] .markdown-body pre { --hljs-theme: 'vs'; }
[data-code-theme="vs2015"] .markdown-body pre { --hljs-theme: 'vs2015'; }



.think-block{
  border-left: 0.5px solid var(--ui-text-muted);
	color: var(--ui-text-muted);
	font-size: smaller;
	display: block;
  margin: 1rem 0;
  padding-left: 0.5rem;
}

[data-theme="dark"] .think-block {
  background-color: #2d2d2d;
}
</style>