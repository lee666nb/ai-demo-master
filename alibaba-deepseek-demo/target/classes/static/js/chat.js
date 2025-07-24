class ChatRoom {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.chatModeInputs = document.querySelectorAll('input[name="mode"]');
        this.connectionStatus = document.getElementById('connectionStatus');

        // 添加消息历史记录
        this.messageHistory = [];
        this.historyIndex = -1;

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateTime();
        this.autoResizeTextarea();
        this.checkConnection();
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

        // 添加消息历史导航（上下箭头键）
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory('down');
            }
        });

        // 模式切换事件
        this.chatModeInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.onModeChange(input.value);
            });
        });

        // 双击消息复制功能
        this.chatMessages.addEventListener('dblclick', (e) => {
            const messageText = e.target.closest('.message-text');
            if (messageText) {
                this.copyMessage(messageText.textContent);
            }
        });
    }

    // 检查连接状态
    async checkConnection() {
        try {
            const response = await fetch('/ai/chat?input=test', { method: 'HEAD' });
            this.updateConnectionStatus(response.ok);
        } catch (error) {
            this.updateConnectionStatus(false);
        }
    }

    updateConnectionStatus(connected) {
        this.connectionStatus.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
        this.connectionStatus.textContent = connected ? '已连接' : '连接失败';
    }

    navigateHistory(direction) {
        if (this.messageHistory.length === 0) return;

        if (direction === 'up') {
            if (this.historyIndex < this.messageHistory.length - 1) {
                this.historyIndex++;
            }
        } else if (direction === 'down') {
            if (this.historyIndex > -1) {
                this.historyIndex--;
            }
        }

        if (this.historyIndex >= 0) {
            this.messageInput.value = this.messageHistory[this.messageHistory.length - 1 - this.historyIndex];
        } else {
            this.messageInput.value = '';
        }
        this.autoResizeTextarea();
    }

    onModeChange(mode) {
        console.log(`切换到${mode}模式`);
        // 可以在这里添加模式切换的提示
        this.addSystemMessage(`已切换到${this.getModeDisplayName(mode)}模式`);
    }

    getModeDisplayName(mode) {
        const names = {
            'normal': '普通',
            'stream': '流式',
            'sse': 'SSE'
        };
        return names[mode] || mode;
    }

    copyMessage(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('消息已复制到剪贴板');
        }).catch(() => {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('消息已复制到剪贴板');
        });
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: fadeInOut 3s ease-in-out;
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
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

        // 添加到历史记录
        this.messageHistory.unshift(message);
        if( this.messageHistory.length > 50) {
            this.messageHistory.pop();
        }
        this.historyIndex = -1;

        // 禁用输入和按钮
        this.setInputState(false);

        // 添加用户消息
        this.addMessage(message, 'user');

        // 清空输入框
        this.messageInput.value = '';
        this.autoResizeTextarea();

        const mode = this.getCurrentMode();

        try {
            // 更新连接状态为连接中
            this.updateConnectionStatus(true);

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
            this.updateConnectionStatus(false);
            this.addMessage('抱歉，发送消息时出现错误，请检查网络连接后重试。', 'ai', true);
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

    addMessage(text, type, isError = false) {
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

        if (isError) {
            messageText.classList.add('error-message');
        }

        return messageDiv;
    }

    addSystemMessage(text) {
        const systemDiv = document.createElement('div');
        systemDiv.className = 'system-message';
        systemDiv.textContent = text;
        systemDiv.style.cssText = `
            text-align: center;
            color: #6c757d;
            font-size: 12px;
            margin: 10px 0;
            font-style: italic;
        `;
        this.chatMessages.appendChild(systemDiv);
        this.scrollToBottom();
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

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-20px); }
        15%, 85% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
    }
    
    .message-text:hover {
        cursor: pointer;
        background-color: rgba(0,0,0,0.05) !important;
    }
    
    .user-message .message-text:hover {
        background-color: rgba(255,255,255,0.1) !important;
    }
`;
document.head.appendChild(style);

// 页面加载完成后初始化聊天室
document.addEventListener('DOMContentLoaded', () => {
    window.chatRoom = new ChatRoom();
});

// 添加全局工具函数
window.chatUtils = {
    clearChat: () => {
        if (window.chatRoom) {
            const confirmed = confirm('确定要清空聊天记录吗？');
            if (confirmed) {
                window.chatRoom.chatMessages.innerHTML = `
                    <div class="message ai-message">
                        <div class="message-avatar">🤖</div>
                        <div class="message-content">
                            <div class="message-text">您好！我是您的AI助手，有什么可以帮助您的吗？</div>
                            <div class="message-time">${window.chatRoom.formatTime(new Date())}</div>
                        </div>
                    </div>
                `;
                window.chatRoom.addSystemMessage('聊天记录已清空');
            }
        }
    },

    exportChat: () => {
        if (window.chatRoom) {
            const messages = Array.from(window.chatRoom.chatMessages.querySelectorAll('.message')).map(msg => {
                const type = msg.classList.contains('user-message') ? '用户' : 'AI';
                const text = msg.querySelector('.message-text').textContent;
                const time = msg.querySelector('.message-time').textContent;
                return `[${time}] ${type}: ${text}`;
            }).join('\n');

            const blob = new Blob([messages], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat_${new Date().toISOString().slice(0,10)}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }
};
