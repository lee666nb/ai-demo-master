// 认证相关JavaScript功能
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupFormValidation();
    }

    bindEvents() {
        // 登录表单提交
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // 注册表单提交
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // 实时验证
        this.setupRealTimeValidation();
    }

    setupRealTimeValidation() {
        const inputs = document.querySelectorAll('.premium-input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearValidation(input));
        });

        // 密码确认验证
        const confirmPassword = document.getElementById('confirmPassword');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', () => this.validatePasswordMatch());
        }
    }

    setupFormValidation() {
        // 设置输入框焦点效果
        const inputs = document.querySelectorAll('.premium-input');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });

            input.addEventListener('blur', function() {
                if (!this.value) {
                    this.parentElement.classList.remove('focused');
                }
            });

            // 如果输入框有值，保持焦点状态
            if (input.value) {
                input.parentElement.classList.add('focused');
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('.premium-btn');
        const username = form.username.value.trim();
        const password = form.password.value;
        const rememberMe = form.rememberMe?.checked || false;

        // 验证输入
        if (!this.validateLoginForm(username, password)) {
            return;
        }

        // 显示加载状态
        this.setButtonLoading(submitBtn, true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    rememberMe: rememberMe
                })
            });

            const result = await response.json();

            if (result.success) {
                // 保存用户信息
                this.saveUserSession(result, rememberMe);

                // 显示成功消息
                this.showMessage('登录成功！正在跳转到ECMO诊疗专家系统...', 'success');

                // 延迟跳转到ECMO诊疗专家系统
                setTimeout(() => {
                    window.location.href = '/ecmo-expert';
                }, 1500);
            } else {
                this.showMessage(result.message || '登录失败，请检查用户名和密码', 'error');
            }
        } catch (error) {
            console.error('登录错误:', error);
            this.showMessage('网络错误，请稍后重试', 'error');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('.premium-btn');
        const username = form.username.value.trim();
        const email = form.email.value.trim();
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;
        const agreeTerms = form.agreeTerms.checked;

        // 验证输入
        if (!this.validateRegisterForm(username, email, password, confirmPassword, agreeTerms)) {
            return;
        }

        // 显示加载状态
        this.setButtonLoading(submitBtn, true);

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password
                })
            });

            const result = await response.json();

            if (result.success) {
                // 显示成功消息
                this.showMessage('注册成功！请登录您的账户', 'success');

                // 延迟跳转到登录页面
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                this.showMessage(result.message || '注册失败，请稍后重试', 'error');
            }
        } catch (error) {
            console.error('注册错误:', error);
            this.showMessage('网络错误，请稍后重试', 'error');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    validateLoginForm(username, password) {
        let isValid = true;

        if (!username) {
            this.showFieldError('username', '请输入用户名');
            isValid = false;
        }

        if (!password) {
            this.showFieldError('password', '请输入密码');
            isValid = false;
        }

        return isValid;
    }

    validateRegisterForm(username, email, password, confirmPassword, agreeTerms) {
        let isValid = true;

        // 验证用户名
        if (!username) {
            this.showFieldError('username', '请输入用户名');
            isValid = false;
        } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            this.showFieldError('username', '用户名只能包含字母、数字和下划线，长度3-20位');
            isValid = false;
        }

        // 验证邮箱
        if (!email) {
            this.showFieldError('email', '请输入邮箱地址');
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            this.showFieldError('email', '请输入有效的邮箱地址');
            isValid = false;
        }

        // 验证密码
        if (!password) {
            this.showFieldError('password', '请输入密码');
            isValid = false;
        } else if (password.length < 6) {
            this.showFieldError('password', '密码长度至少6位');
            isValid = false;
        }

        // 验证确认密码
        if (!confirmPassword) {
            this.showFieldError('confirmPassword', '请确认密码');
            isValid = false;
        } else if (password !== confirmPassword) {
            this.showFieldError('confirmPassword', '两次输入的密码不一致');
            isValid = false;
        }

        // 验证服务条款
        if (!agreeTerms) {
            this.showMessage('请同意服务条款和隐私政策', 'error');
            isValid = false;
        }

        return isValid;
    }

    validateField(input) {
        const fieldName = input.name;
        const value = input.value.trim();

        switch (fieldName) {
            case 'username':
                if (!value) {
                    this.showFieldError(fieldName, '请输入用户名');
                } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
                    this.showFieldError(fieldName, '用户名只能包含字母、数字和下划线，长度3-20位');
                } else {
                    this.clearFieldError(fieldName);
                }
                break;
            case 'email':
                if (!value) {
                    this.showFieldError(fieldName, '请输入邮箱地址');
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    this.showFieldError(fieldName, '请输入有效的邮箱地址');
                } else {
                    this.clearFieldError(fieldName);
                }
                break;
            case 'password':
                if (!value) {
                    this.showFieldError(fieldName, '请输入密码');
                } else if (value.length < 6) {
                    this.showFieldError(fieldName, '密码长度至少6位');
                } else {
                    this.clearFieldError(fieldName);
                }
                break;
        }
    }

    validatePasswordMatch() {
        const password = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;

        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError('confirmPassword', '两次输入的密码不一致');
        } else if (confirmPassword) {
            this.clearFieldError('confirmPassword');
        }
    }

    clearValidation(input) {
        this.clearFieldError(input.name);
    }

    showFieldError(fieldName, message) {
        const feedbackElement = document.getElementById(`${fieldName}-feedback`);
        const inputContainer = document.getElementById(fieldName)?.parentElement;

        if (feedbackElement) {
            feedbackElement.textContent = message;
            feedbackElement.style.display = 'block';
        }

        if (inputContainer) {
            inputContainer.classList.add('error');
        }
    }

    clearFieldError(fieldName) {
        const feedbackElement = document.getElementById(`${fieldName}-feedback`);
        const inputContainer = document.getElementById(fieldName)?.parentElement;

        if (feedbackElement) {
            feedbackElement.textContent = '';
            feedbackElement.style.display = 'none';
        }

        if (inputContainer) {
            inputContainer.classList.remove('error');
        }
    }

    setButtonLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    showMessage(message, type = 'info') {
        // 移除现有的消息
        const existingMessage = document.querySelector('.auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 创建新消息
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message ${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // 插入到表单前面
        const formSection = document.querySelector('.form-section');
        if (formSection) {
            formSection.insertBefore(messageDiv, formSection.firstChild);
        }

        // 自动移除消息
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    saveUserSession(userData, rememberMe) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('userInfo', JSON.stringify({
            username: userData.username,
            email: userData.email,
            loginTime: new Date().toISOString()
        }));
    }

    getUserSession() {
        const sessionData = sessionStorage.getItem('userInfo') || localStorage.getItem('userInfo');
        return sessionData ? JSON.parse(sessionData) : null;
    }

    clearUserSession() {
        sessionStorage.removeItem('userInfo');
        localStorage.removeItem('userInfo');
    }
}

// 密码显示切换功能
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggleBtn = input.nextElementSibling;
    const icon = toggleBtn.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// 社交登录功能
function socialLogin(provider) {
    // 这里可以实现第三方登录逻辑
    console.log(`正在使用 ${provider} 登录...`);
    // 实际项目中需要接入相应的第三方登录SDK
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});
