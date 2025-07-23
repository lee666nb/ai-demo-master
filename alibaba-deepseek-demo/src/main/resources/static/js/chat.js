class ChatRoom {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.chatModeInputs = document.querySelectorAll('input[name="mode"]');

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateTime();
        this.autoResizeTextarea();
    }

    bindEvents() {
        // 发送按钮点击事件
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // 输入框回车事件
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 输入框自动调整高度
        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 100) + 'px';
    }

    getCurrentMode() {
        return document.querySelector('input[name="mode"]:checked').value;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // 禁用输入和按钮
        this.setInputState(false);

        // 添加用户消息
        this.addMessage(message, 'user');

        // 清空输入框
        this.messageInput.value = '';
        this.autoResizeTextarea();

        const mode = this.getCurrentMode();

        try {
            switch (mode) {
                case 'normal':
                    await this.sendNormalMessage(message);
                    break;
                case 'stream':
                    await this.sendStreamMessage(message);
                    break;
                case 'sse':
                    await this.sendSSEMessage(message);
                    break;
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            this.addMessage('抱歉，发送消息时出现错误，请稍后重试。', 'ai');
        } finally {
            this.setInputState(true);
        }
    }

    async sendNormalMessage(message) {
        this.showTypingIndicator();

        try {
            const response = await fetch(`/ai/chat?input=${encodeURIComponent(message)}`);
            const result = await response.text();

            this.hideTypingIndicator();
            this.addMessage(result, 'ai');
        } catch (error) {
            this.hideTypingIndicator();
            throw error;
        }
    }

    async sendStreamMessage(message) {
        this.showTypingIndicator();

        try {
            const response = await fetch(`/ai/stream?input=${encodeURIComponent(message)}`);
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            this.hideTypingIndicator();
            const aiMessageElement = this.addMessage('', 'ai');
            const messageTextElement = aiMessageElement.querySelector('.message-text');

            let result = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                result += chunk;
                messageTextElement.textContent = result;
                this.scrollToBottom();
            }
        } catch (error) {
            this.hideTypingIndicator();
            throw error;
        }
    }

    async sendSSEMessage(message) {
        this.showTypingIndicator();

        try {
            const eventSource = new EventSource(`/ai/sseChat?input=${encodeURIComponent(message)}`);

            this.hideTypingIndicator();
            const aiMessageElement = this.addMessage('', 'ai');
            const messageTextElement = aiMessageElement.querySelector('.message-text');

            let result = '';

            eventSource.onmessage = (event) => {
                result += event.data;
                messageTextElement.textContent = result;
                this.scrollToBottom();
            };

            eventSource.onerror = (error) => {
                console.error('SSE连接错误:', error);
                eventSource.close();
                if (!result) {
                    this.addMessage('SSE连接出现错误，请稍后重试。', 'ai');
                }
            };

            eventSource.onopen = () => {
                console.log('SSE连接已建立');
            };

            // 监听连接完成
            eventSource.addEventListener('close', () => {
                eventSource.close();
            });

        } catch (error) {
            this.hideTypingIndicator();
            throw error;
        }
    }

    addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = type === 'user' ? '👤' : '🤖';

        const content = document.createElement('div');
        content.className = 'message-content';

        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = text;

        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.formatTime(new Date());

        content.appendChild(messageText);
        content.appendChild(messageTime);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        return messageDiv;
    }

    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    setInputState(enabled) {
        this.messageInput.disabled = !enabled;
        this.sendButton.disabled = !enabled;

        if (enabled) {
            this.messageInput.focus();
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 10);
    }

    formatTime(date) {
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    updateTime() {
        // 更新欢迎消息的时间
        const welcomeTime = document.querySelector('.ai-message .message-time');
        if (welcomeTime) {
            welcomeTime.textContent = this.formatTime(new Date());
        }
    }
}

// 页面加载完成后初始化聊天室
document.addEventListener('DOMContentLoaded', () => {
    new ChatRoom();
});

// 添加一些实用的工具函数
window.chatUtils = {
    // 清空聊天记录
    clearChat: () => {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="message ai-message">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="message-text">您好！我是您的AI助手，有什么可以帮助您的吗？</div>
                    <div class="message-time">${new Date().toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</div>
                </div>
            </div>
        `;
    },

    // 导出聊天记录
    exportChat: () => {
        const messages = document.querySelectorAll('.message');
        const chatData = Array.from(messages).map(msg => {
            const isUser = msg.classList.contains('user-message');
            const text = msg.querySelector('.message-text').textContent;
            const time = msg.querySelector('.message-time').textContent;
            return {
                type: isUser ? 'user' : 'ai',
                text: text,
                time: time
            };
        });

        const dataStr = JSON.stringify(chatData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
};
