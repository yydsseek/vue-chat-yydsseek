import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';

// 定义接口
export interface ChatMessage {
	id: string;
	conversationId: string;
	role: 'user' | 'assistant';
	content: string;
	createdAt: number;
	reasoning_content: string;
	model?: string;
	provider?: string;
	inputTokens?: number;      // 输入的 tokens 数量
	outputTokens?: number;     // 输出的 tokens 数量
	firstResponseTime?: number; // 首次响应时间（毫秒）
	speed?: number;            // 响应速度（tokens/秒）
}

export interface Conversation {
	id: string;
	title: string;
	createdAt: number;
	updatedAt: number;
}

// 数据库配置
const DB_NAME = 'chatDB';
const DB_VERSION = 1;

// 初始化数据库
function initDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			
			// 创建会话表
			if (!db.objectStoreNames.contains('conversations')) {
				const conversationStore = db.createObjectStore('conversations', { keyPath: 'id' });
				conversationStore.createIndex('updatedAt', 'updatedAt');
			}
			
			// 创建消息表
			if (!db.objectStoreNames.contains('messages')) {
				const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
				messageStore.createIndex('conversationId', 'conversationId');
			}
		};
	});
}

export const useChatStore = defineStore('chat', () => {
	// State
	const currentConversationId = ref<string | null>(null);
	const messages = ref<ChatMessage[]>([]);
	const conversations = ref<Conversation[]>([]);

	// DB操作辅助函数
	async function getDB(): Promise<IDBDatabase> {
		return await initDB();
	}

	// Conversation Actions
	async function createConversation(title: string = ''): Promise<string> {
		const db = await getDB();
		const now = Date.now();
		const conversation: Conversation = {
			id: uuidv4(),
			title,
			createdAt: now,
			updatedAt: now
		};

		return new Promise((resolve, reject) => {
			const transaction = db.transaction('conversations', 'readwrite');
			const store = transaction.objectStore('conversations');
			const request = store.add(conversation);

			request.onsuccess = () => {
				conversations.value.push(conversation);
				conversations.value = conversations.value.sort((a, b) => b.createdAt - a.createdAt);
				currentConversationId.value = conversation.id;
				loadMessages(conversation.id);
				resolve(conversation.id);
			};
			request.onerror = () => reject(request.error);
		});
	}

	async function loadConversations() {
		const db = await getDB();
		return new Promise<void>((resolve, reject) => {
			const transaction = db.transaction('conversations', 'readonly');
			const store = transaction.objectStore('conversations');
			const request = store.getAll();

			request.onsuccess = async () => {
				conversations.value = request.result.sort((a, b) => b.createdAt - a.createdAt);
				if (conversations.value.length === 0) {
					await createConversation();
				}
				currentConversationId.value = conversations.value[0]?.id || null;
				await loadMessages(currentConversationId.value || '');
				resolve();
			};
			request.onerror = () => reject(request.error);
		});
	}

	// Message Actions
	async function addMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>) {
		if (!currentConversationId.value) {
			await createConversation();
		}
		
		const db = await getDB();
		const newMessage: ChatMessage = {
			...message,
			id: uuidv4(),
			conversationId: currentConversationId.value!,
			createdAt: Date.now()
		};

		messages.value.push(newMessage);
		return new Promise<ChatMessage>((resolve, reject) => {
			const transaction = db.transaction(['messages', 'conversations'], 'readwrite');
			const messageStore = transaction.objectStore('messages');
			const conversationStore = transaction.objectStore('conversations');
			// 添加消息
			messageStore.add(newMessage);
			if (messages.value.length === 1) {
				const conversation = conversations.value.find(c => c.id === currentConversationId.value);
				if (conversation) {
					conversation.title = message.content.slice(0, 30);
					// 创建一个新的纯对象，只包含需要的属性
					const conversationToStore = {
						id: conversation.id,
						title: message.content.slice(0, 30),
						createdAt: conversation.createdAt,
						updatedAt: Date.now()
					};
					conversationStore.put(conversationToStore);
				}
			}
			transaction.oncomplete = () => {
				resolve(newMessage);
			};
			transaction.onerror = () => reject(transaction.error);
		});
	}

	async function removeMessage(messageId: string) {
		const db = await getDB();
		// Find the index of the message to remove
		const messageIndex = messages.value.findIndex(m => m.id === messageId);
		if (messageIndex === -1) return;
		
		// Get all messages to remove (including and after the specified message)
		const messagesToRemove = messages.value.slice(messageIndex);
		const messageIds = messagesToRemove.map(m => m.id);
		
		// Update the messages array
		messages.value = messages.value.slice(0, messageIndex);
		
		return new Promise<void>((resolve, reject) => {
			const transaction = db.transaction(['messages'], 'readwrite');
			const messageStore = transaction.objectStore('messages');
			
			// Delete all messages
			messageIds.forEach(id => {
				messageStore.delete(id);
			});
			
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
		});
	}


	async function loadMessages(conversationId: string) {
		const db = await getDB();
		return new Promise<void>((resolve, reject) => {
			const transaction = db.transaction('messages', 'readonly');
			const store = transaction.objectStore('messages');
			const index = store.index('conversationId');
			const request = index.getAll(conversationId);
			request.onsuccess = () => {
				messages.value = request.result.sort((a, b) => a.createdAt - b.createdAt);
				currentConversationId.value = conversationId;
				resolve();
			};
			request.onerror = () => reject(request.error);
		});
	}

	async function clearMessages(conversationId: string) {
		if (!conversationId) return;

		const db = await getDB();
		return new Promise<void>((resolve, reject) => {
			const transaction = db.transaction(['messages', 'conversations'], 'readwrite');
			const messageStore = transaction.objectStore('messages');
			const conversationStore = transaction.objectStore('conversations');

			// 删除当前会话的所有消息
			const index = messageStore.index('conversationId');
			const request = index.getAll(conversationId);
			
			request.onsuccess = () => {
				request.result.forEach((message: ChatMessage) => {
					messageStore.delete(message.id);
				});
			};

			// 删除会话
			conversationStore.delete(conversationId);
			transaction.oncomplete = () => {
				conversations.value = conversations.value.filter(c => c.id !== conversationId);
				if (conversationId === currentConversationId.value) {
					currentConversationId.value = conversations.value[0]?.id || null;
				}
				resolve();
			};
			transaction.onerror = () => reject(transaction.error);
		});
	}



	async function updateLastReasoning(reasoning_content: string, message: ChatMessage | null) {
		if (!message) return;
		const db = await getDB();
		// Create a new message object to trigger reactivity
		const updatedMessage = { ...message, reasoning_content: reasoning_content };
		// Update the message in the messages array
		const index = messages.value.findIndex(m => m.id === message.id);
		if (index !== -1) {
			messages.value[index] = updatedMessage;
		}
		return new Promise<void>((resolve, reject) => {
			const transaction = db.transaction(['messages'], 'readwrite');
			const messageStore = transaction.objectStore('messages');
			messageStore.put(updatedMessage);
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
		});
	}


	async function updateLastMessage(message: ChatMessage | null) {
		if (!message) return;
		const db = await getDB();
		// Create a new message object to trigger reactivity
		const updatedMessage = { ...message };
		// Update the message in the messages array
		const index = messages.value.findIndex(m => m.id === message.id);
		if (index !== -1) {
			messages.value[index] = updatedMessage;
		}
		return new Promise<void>((resolve, reject) => {
			const transaction = db.transaction(['messages'], 'readwrite');
			const messageStore = transaction.objectStore('messages');
			messageStore.put(updatedMessage);
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
		});
	}

	return {
		// State
		currentConversationId,
		messages,
		conversations,
		
		// Actions
		createConversation,
		loadConversations,
		addMessage,
		removeMessage,
		loadMessages,
		clearMessages,
		updateLastMessage
	};
});
