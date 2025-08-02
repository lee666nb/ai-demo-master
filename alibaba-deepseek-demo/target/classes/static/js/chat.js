// AI聊天室高级功能JavaScript
class AdvancedChatManager {
    constructor() {
        this.currentChatId = null;
        this.currentUser = null;
        this.chatHistory = [];
        this.isTyping = false;
        this.settings = this.loadSettings();
        this.profile = this.loadProfile();
        this.init();
    }

    init() {
        this.checkAuth();
        this.bindEvents();
        this.loadUserInfo();
        this.setupAutoResize();
        this.loadChatHistory();
        this.applySettings();
    }

    checkAuth() {
        const userInfo = this.getUserSession();
        if (!userInfo) {
            window.location.href = '/login';
            return;
        }
        this.currentUser = userInfo;
    }

    getUserSession() {
        const sessionData = sessionStorage.getItem('userInfo') || localStorage.getItem('userInfo');
        return sessionData ? JSON.parse(sessionData) : null;
    }

    loadUserInfo() {
        if (this.currentUser) {
            document.getElementById('displayUsername').textContent = this.profile.nickname || this.currentUser.username;

            // 加载用户头像
            const avatarImg = document.getElementById('userAvatarImg');
            if (this.profile.avatar) {
                avatarImg.src = this.profile.avatar;
            }
        }
    }

    bindEvents() {
        // 发送��息事件
        const sendBtn = document.querySelector('.send-btn');
        const messageInput = document.getElementById('messageInput');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (messageInput) {
            // 根据设置确定快捷键
            const shortcut = this.settings.shortcutKey || 'ctrl+enter';

            messageInput.addEventListener('keydown', (e) => {
                if (shortcut === 'enter' && e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                } else if (shortcut === 'ctrl+enter' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            messageInput.addEventListener('input', () => {
                this.updateCharCount();
                this.toggleSendButton();
            });
        }

        // 头像上传事件
        const avatarInput = document.getElementById('avatarInput');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => this.handleAvatarChange(e));
        }

        // 搜索功能
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchChats(e.target.value));
        }
    }

    setupAutoResize() {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            });
        }
    }

    updateCharCount() {
        const messageInput = document.getElementById('messageInput');
        const charCount = document.querySelector('.char-count');

        if (messageInput && charCount) {
            const count = messageInput.value.length;
            charCount.textContent = `${count}/2000`;

            charCount.className = 'char-count';
            if (count > 1800) {
                charCount.classList.add('warning');
            }
            if (count > 2000) {
                charCount.classList.add('error');
            }
        }
    }

    toggleSendButton() {
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.querySelector('.send-btn');

        if (messageInput && sendBtn) {
            const hasContent = messageInput.value.trim().length > 0;
            sendBtn.disabled = !hasContent || this.isTyping;
        }
    }

    async sendMessage(quickMessage = null) {
        const messageInput = document.getElementById('messageInput');
        const message = quickMessage || messageInput.value.trim();

        if (!message || this.isTyping) return;

        // 清空输入框
        if (!quickMessage) {
            messageInput.value = '';
            messageInput.style.height = 'auto';
            this.updateCharCount();
            this.toggleSendButton();
        }

        // 隐藏欢迎区域
        this.hideWelcomeSection();

        // 添加用户消息
        this.addMessage(message, 'user');

        // 显示AI正在输入
        this.showTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    chatId: this.currentChatId,
                    username: this.currentUser.username
                })
            });

            const result = await response.json();

            if (result.success) {
                this.hideTypingIndicator();
                this.addMessage(result.reply, 'assistant');

                if (result.chatId) {
                    this.currentChatId = result.chatId;
                    this.updateChatTitle();
                    this.loadChatHistory(); // 刷新聊天历史
                }
            } else {
                this.hideTypingIndicator();
                this.addMessage('抱歉，我现在无法回复。请稍后再试。', 'assistant');
            }
        } catch (error) {
            console.error('发送消息错误:', error);
            this.hideTypingIndicator();
            this.addMessage('网络错误，请检查连接后重试。', 'assistant');
        }
    }

    addMessage(content, type) {
        const messagesContainer = document.getElementById('chatMessages');

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const showTime = this.settings.showTime !== false;

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas ${type === 'user' ? 'fa-user' : 'fa-robot'}"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    ${this.formatMessage(content)}
                </div>
                ${showTime ? `<div class="message-time">${time}</div>` : ''}
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        this.updateChatInfo();
    }

    formatMessage(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    hideWelcomeSection() {
        const welcomeSection = document.querySelector('.welcome-section');
        if (welcomeSection) {
            welcomeSection.style.display = 'none';
        }
    }

    showTypingIndicator() {
        this.isTyping = true;
        this.toggleSendButton();

        const messagesContainer = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant';
        typingDiv.id = 'typing-indicator';

        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="typing-indicator">
                <span>AI正在思考</span>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;

        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        this.toggleSendButton();

        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async loadChatHistory() {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`/api/chats/${this.currentUser.username}`);
            const result = await response.json();

            if (result.success) {
                this.renderChatHistory(result.chats);
            }
        } catch (error) {
            console.error('加载聊天历史失败:', error);
        }
    }

    renderChatHistory(chats) {
        const historyList = document.getElementById('chatHistoryList');

        if (chats.length === 0) {
            historyList.innerHTML = `
                <div class="history-placeholder">
                    <i class="fas fa-comments"></i>
                    <p>暂无对话记录</p>
                    <span>开始您的第一次AI对话</span>
                </div>
            `;
            return;
        }

        historyList.innerHTML = '';

        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'history-item';
            if (chat.id === this.currentChatId) {
                chatItem.classList.add('active');
            }

            const lastActiveTime = new Date(chat.lastActiveTime).toLocaleDateString();

            chatItem.innerHTML = `
                <div class="title">${chat.title}</div>
                <div class="preview">共 ${chat.messageCount} 条消息</div>
                <div class="meta">
                    <span>${lastActiveTime}</span>
                    <button class="delete-chat-btn" onclick="deleteChatHistory('${chat.id}')" title="删除对话">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            chatItem.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-chat-btn')) {
                    this.loadChat(chat.id);
                }
            });

            historyList.appendChild(chatItem);
        });
    }

    async loadChat(chatId) {
        try {
            const response = await fetch(`/api/chat/${chatId}`);
            const result = await response.json();

            if (result.success) {
                this.currentChatId = chatId;
                this.renderChatMessages(result.messages);
                this.updateChatTitle(result.title);
                this.updateActiveChat();
            }
        } catch (error) {
            console.error('加载对话失败:', error);
        }
    }

    renderChatMessages(messages) {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = '';

        messages.forEach(msg => {
            this.addMessage(msg.content, msg.role);
        });
    }

    updateChatTitle(title = '新对话') {
        document.getElementById('chatTitle').textContent = title;
        document.getElementById('currentChatTitle').textContent = title;
    }

    updateActiveChat() {
        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.remove('active');
        });

        document.querySelectorAll('.history-item').forEach(item => {
            const titleElement = item.querySelector('.title');
            if (titleElement && titleElement.textContent === document.getElementById('chatTitle').textContent) {
                item.classList.add('active');
            }
        });
    }

    updateChatInfo() {
        const messages = document.querySelectorAll('.message');
        document.getElementById('messageCount').textContent = messages.length.toString();

        if (this.currentChatId && messages.length === 1) {
            document.getElementById('chatCreateTime').textContent = new Date().toLocaleString();
        }
    }

    searchChats(query) {
        const historyItems = document.querySelectorAll('.history-item');

        historyItems.forEach(item => {
            const title = item.querySelector('.title').textContent.toLowerCase();
            const isMatch = title.includes(query.toLowerCase());
            item.style.display = isMatch ? 'block' : 'none';
        });
    }

    // 设置相关方法
    loadSettings() {
        const saved = localStorage.getItem('chatSettings');
        return saved ? JSON.parse(saved) : {
            autoSave: true,
            shortcutKey: 'ctrl+enter',
            showTime: true,
            themeMode: 'dark',
            fontSize: 'medium',
            compactMode: false,
            aiSpeed: 'balanced',
            contextLength: 'medium',
            streamOutput: true
        };
    }

    saveSettings() {
        localStorage.setItem('chatSettings', JSON.stringify(this.settings));
        this.applySettings();
    }

    applySettings() {
        // 应用字体大小设置
        const fontSize = this.settings.fontSize || 'medium';
        document.body.className = `font-${fontSize}`;

        // 应用紧凑模式
        if (this.settings.compactMode) {
            document.body.classList.add('compact-mode');
        }
    }

    // 个人资料相关方法
    loadProfile() {
        const saved = localStorage.getItem('userProfile');
        return saved ? JSON.parse(saved) : {
            nickname: '',
            bio: '',
            avatar: null
        };
    }

    saveProfile() {
        localStorage.setItem('userProfile', JSON.stringify(this.profile));
        this.loadUserInfo();
    }

    handleAvatarChange(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const avatarPreview = document.getElementById('avatarPreview');
                const userAvatarImg = document.getElementById('userAvatarImg');

                avatarPreview.src = e.target.result;
                userAvatarImg.src = e.target.result;

                this.profile.avatar = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
}

// 全局函数
function newChat() {
    const chatManager = window.chatManager;
    if (chatManager) {
        chatManager.currentChatId = null;
        chatManager.updateChatTitle('AI助手');

        // 清空消息区域并显示欢迎页面
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = `
            <div class="welcome-section">
                <div class="welcome-avatar">
                    <div class="ai-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                </div>
                <div class="welcome-content">
                    <h3>欢迎使用AI聊天室</h3>
                    <p>我是您的AI智能助手，基于先进的大语言模型</p>
                    <div class="quick-actions">
                        <button class="quick-btn" onclick="sendQuickMessage('你好，请介绍一下自己')">
                            <i class="fas fa-hand-wave"></i>
                            <span>打个招呼</span>
                        </button>
                        <button class="quick-btn" onclick="sendQuickMessage('今天天气怎么样？')">
                            <i class="fas fa-cloud-sun"></i>
                            <span>天气查询</span>
                        </button>
                        <button class="quick-btn" onclick="sendQuickMessage('帮我写一首诗')">
                            <i class="fas fa-feather"></i>
                            <span>创意写作</span>
                        </button>
                        <button class="quick-btn" onclick="sendQuickMessage('解释一下人工智能')">
                            <i class="fas fa-lightbulb"></i>
                            <span>知识问答</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        chatManager.updateActiveChat();
    }
}

function sendQuickMessage(message) {
    const chatManager = window.chatManager;
    if (chatManager) {
        chatManager.sendMessage(message);
    }
}

function clearCurrentChat() {
    if (confirm('确定要清除当前对话吗？')) {
        newChat();
    }
}

async function deleteChatHistory(chatId) {
    if (confirm('确定要删除这个对话吗？')) {
        try {
            const chatManager = window.chatManager;
            const response = await fetch(`/api/chat/${chatId}?username=${chatManager.currentUser.username}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                chatManager.loadChatHistory();
                if (chatManager.currentChatId === chatId) {
                    newChat();
                }
            }
        } catch (error) {
            console.error('删除对话失败:', error);
        }
    }
}

function exportChat() {
    const messages = document.querySelectorAll('.message');
    let chatContent = '# AI聊天记录\n\n';

    messages.forEach(message => {
        const type = message.classList.contains('user') ? '用户' : 'AI助手';
        const bubble = message.querySelector('.message-bubble');
        const timeElement = message.querySelector('.message-time');

        if (bubble) {
            const content = bubble.textContent.trim();
            const time = timeElement ? timeElement.textContent : '';
            chatContent += `**${type}** ${time ? `(${time})` : ''}\n${content}\n\n`;
        }
    });

    const blob = new Blob([chatContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function logout() {
    if (confirm('确定要退出登录吗？')) {
        sessionStorage.removeItem('userInfo');
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
    }
}

// UI 控制函数
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

function toggleSearch() {
    const searchContainer = document.getElementById('searchContainer');
    searchContainer.classList.toggle('show');

    if (searchContainer.classList.contains('show')) {
        document.getElementById('searchInput').focus();
    }
}

function toggleChatInfo() {
    const panel = document.getElementById('chatInfoPanel');
    panel.classList.toggle('open');
}

function toggleVoiceInput() {
    const voiceBtn = document.querySelector('.voice-btn');
    const isRecording = voiceBtn.classList.contains('recording');

    if (isRecording) {
        voiceBtn.classList.remove('recording');
        // 停止录音逻辑
    } else {
        voiceBtn.classList.add('recording');
        // 开始录音逻辑
    }
}

function attachFile() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,.pdf,.doc,.docx,.txt';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log('选择文件:', file.name);
            // 这里可以实现文件上传逻辑
        }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

function insertEmoji() {
    const messageInput = document.getElementById('messageInput');
    const emojis = ['😊', '😂', '🤔', '👍', '❤️', '🎉', '🚀', '💡'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    messageInput.value += randomEmoji;
    messageInput.focus();

    window.chatManager.updateCharCount();
    window.chatManager.toggleSendButton();
}

// 模态框控制
function openProfileModal() {
    const modal = document.getElementById('profileModalOverlay');
    const chatManager = window.chatManager;

    // 填充当前信息
    document.getElementById('profileUsername').value = chatManager.currentUser.username;
    document.getElementById('profileEmail').value = chatManager.currentUser.email || '';
    document.getElementById('profileNickname').value = chatManager.profile.nickname || '';
    document.getElementById('profileBio').value = chatManager.profile.bio || '';

    const avatarPreview = document.getElementById('avatarPreview');
    avatarPreview.src = chatManager.profile.avatar || document.getElementById('userAvatarImg').src;

    modal.classList.add('show');
}

function closeProfileModal() {
    document.getElementById('profileModalOverlay').classList.remove('show');
}

function changeAvatar() {
    document.getElementById('avatarInput').click();
}

function saveProfile() {
    const chatManager = window.chatManager;

    chatManager.profile.nickname = document.getElementById('profileNickname').value;
    chatManager.profile.bio = document.getElementById('profileBio').value;

    chatManager.saveProfile();
    closeProfileModal();
}

function openSettingsModal() {
    const modal = document.getElementById('settingsModalOverlay');
    const chatManager = window.chatManager;

    // 填充当前设置
    document.getElementById('autoSave').checked = chatManager.settings.autoSave;
    document.getElementById('shortcutKey').value = chatManager.settings.shortcutKey;
    document.getElementById('showTime').checked = chatManager.settings.showTime;
    document.getElementById('themeMode').value = chatManager.settings.themeMode;
    document.getElementById('fontSize').value = chatManager.settings.fontSize;
    document.getElementById('compactMode').checked = chatManager.settings.compactMode;
    document.getElementById('aiSpeed').value = chatManager.settings.aiSpeed;
    document.getElementById('contextLength').value = chatManager.settings.contextLength;
    document.getElementById('streamOutput').checked = chatManager.settings.streamOutput;

    modal.classList.add('show');
}

function closeSettingsModal() {
    document.getElementById('settingsModalOverlay').classList.remove('show');
}

function switchTab(tabName) {
    // 切换标签按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');

    // 切换内容
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

function saveSettings() {
    const chatManager = window.chatManager;

    chatManager.settings.autoSave = document.getElementById('autoSave').checked;
    chatManager.settings.shortcutKey = document.getElementById('shortcutKey').value;
    chatManager.settings.showTime = document.getElementById('showTime').checked;
    chatManager.settings.themeMode = document.getElementById('themeMode').value;
    chatManager.settings.fontSize = document.getElementById('fontSize').value;
    chatManager.settings.compactMode = document.getElementById('compactMode').checked;
    chatManager.settings.aiSpeed = document.getElementById('aiSpeed').value;
    chatManager.settings.contextLength = document.getElementById('contextLength').value;
    chatManager.settings.streamOutput = document.getElementById('streamOutput').checked;

    chatManager.saveSettings();
    closeSettingsModal();
}

function sendMessage() {
    const chatManager = window.chatManager;
    if (chatManager) {
        chatManager.sendMessage();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.chatManager = new AdvancedChatManager();
});
