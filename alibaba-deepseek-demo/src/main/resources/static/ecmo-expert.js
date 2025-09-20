// ECMO诊疗专家系统 JavaScript - 重新编写
class ECMOExpertSystem {
    constructor() {
        this.currentUser = localStorage.getItem('username') || '医生用户';
        this.currentAssessment = null;
        this.assessmentHistory = JSON.parse(localStorage.getItem('ecmoAssessments') || '[]');
        this.chartInstances = {}; // 存储图表实例，避免重复创建
        this.chartsInitialized = false; // 标记图表是否已初始化
        this.filteredHistory = [...this.assessmentHistory]; // 初始化时显示所有历史记录

        // 新增：用户相关缓存
        this.userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        this.userId = parseInt(localStorage.getItem('userId') || '0', 10) || null;
        this.avatarUrl = localStorage.getItem('avatarUrl') || '';

        this.init();
    }

    init() {
        this.updateUsername();
        this.applyAvatar();
        this.bindEvents();
        this.loadKnowledge();
        this.setDefaultValues();
        this.loadAssessmentHistory();

        // 如果默认显示介绍页面，立即初始化图表
        if (document.getElementById('introduction-section')?.classList.contains('active')) {
            this.delayedInitCharts();
        }
    }

    updateUsername() {
        const usernameEl = document.getElementById('username');
        if (usernameEl) {
            const name = this.userProfile.realName || this.currentUser || '医生用户';
            usernameEl.textContent = name;
        }
    }

    applyAvatar() {
        const avatarEl = document.getElementById('userAvatar');
        if (!avatarEl) return;
        if (this.avatarUrl) {
            avatarEl.style.backgroundImage = `url('${this.avatarUrl}')`;
            avatarEl.style.backgroundSize = 'cover';
            avatarEl.style.backgroundPosition = 'center';
            avatarEl.textContent = '';
        }
    }

    bindEvents() {
        // 导航菜单事件
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const onclickAttr = e.target.closest('.nav-item').getAttribute('onclick');
                if (onclickAttr) {
                    const section = onclickAttr.match(/'(.+)'/)[1];
                    this.showSection(section);
                }
            });
        });

        // 表单提交事件
        const ecmoForm = document.getElementById('ecmo-form');
        if (ecmoForm) {
            ecmoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleECMOAssessment();
            });
        }

        const quickForm = document.getElementById('quick-form');
        if (quickForm) {
            quickForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleQuickAssessment();
            });
        }

        // 历史记录搜索事件
        const historySearch = document.getElementById('history-search');
        if (historySearch) {
            historySearch.addEventListener('input', () => this.searchHistory());
        }

        // 模态框关闭事件（点击遮罩关闭）
        document.addEventListener('click', (e) => {
            if (e.target.classList?.contains('modal')) {
                this.closeModalByEl(e.target);
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // 新增：用户菜单交互
        const trigger = document.getElementById('userMenuTrigger');
        const dropdown = document.getElementById('userDropdown');
        if (trigger && dropdown) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
                    dropdown.classList.remove('show');
                }
            });
        }
    }

    // ====== 用户菜单-功能 ======
    openProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (!modal) return;
        // 回填数据
        document.getElementById('profile-username')?.setAttribute('value', this.currentUser);
        document.getElementById('profile-realName')?.setAttribute('value', this.userProfile.realName || '');
        document.getElementById('profile-department')?.setAttribute('value', this.userProfile.department || '');
        document.getElementById('profile-title')?.setAttribute('value', this.userProfile.title || '');
        document.getElementById('profile-hospital')?.setAttribute('value', this.userProfile.hospital || '');
        document.getElementById('profile-phone')?.setAttribute('value', this.userProfile.phone || '');
        document.getElementById('profile-email')?.setAttribute('value', this.userProfile.email || '');
        document.getElementById('profile-avatarUrl')?.setAttribute('value', this.avatarUrl || '');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    async saveProfile() {
        // 读取表单数据
        const profile = {
            realName: document.getElementById('profile-realName')?.value?.trim() || '',
            department: document.getElementById('profile-department')?.value?.trim() || '',
            title: document.getElementById('profile-title')?.value?.trim() || '',
            hospital: document.getElementById('profile-hospital')?.value?.trim() || '',
            phone: document.getElementById('profile-phone')?.value?.trim() || '',
            email: document.getElementById('profile-email')?.value?.trim() || '',
            avatarUrl: document.getElementById('profile-avatarUrl')?.value?.trim() || ''
        };

        // 本地缓存立即生效
        this.userProfile = { ...this.userProfile, ...profile };
        localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
        if (profile.avatarUrl) {
            this.avatarUrl = profile.avatarUrl;
            localStorage.setItem('avatarUrl', this.avatarUrl);
            this.applyAvatar();
        }
        if (profile.realName) {
            localStorage.setItem('username', profile.realName);
            this.currentUser = profile.realName;
            this.updateUsername();
        }

        // 如果有后端 userId，则尝试调用后端接口（存在则更新，不存在则忽略错误）
        if (this.userId) {
            try {
                this.showLoading('正在保存个人资料...');
                const resp = await fetch('/api/profile/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: this.userId,
                        realName: profile.realName,
                        department: profile.department,
                        title: profile.title,
                        hospital: profile.hospital,
                        phone: profile.phone,
                        email: profile.email
                    })
                });
                await resp.json().catch(() => ({}));
                // 尝试更新头像（如果填写了）
                if (profile.avatarUrl) {
                    await fetch('/api/avatar/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: this.userId, avatarUrl: profile.avatarUrl })
                    }).catch(() => {});
                }
                this.showSuccess('个人资料已保存');
            } catch (e) {
                this.showError('后端未提供资料更新接口，已保存到本地');
            } finally {
                this.hideLoading();
            }
        } else {
            this.showSuccess('个人资料已保存（本地）');
        }

        this.closeModalById('profile-modal');
    }

    openPasswordModal() {
        const modal = document.getElementById('password-modal');
        if (!modal) return;
        document.getElementById('pwd-current').value = '';
        document.getElementById('pwd-new').value = '';
        document.getElementById('pwd-confirm').value = '';
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    async savePassword() {
        const current = document.getElementById('pwd-current')?.value || '';
        const pwd = document.getElementById('pwd-new')?.value || '';
        const confirmPwd = document.getElementById('pwd-confirm')?.value || '';

        if (pwd.length < 6) {
            this.showError('新密码长度至少6位');
            return;
        }
        if (pwd !== confirmPwd) {
            this.showError('两次输入的新密码不一致');
            return;
        }

        // 当前后端未提供修改密码接口，执行本地提示
        this.showSuccess('密码已更新（示例）');
        this.closeModalById('password-modal');
    }

    openNotifications() {
        const modal = document.getElementById('notice-modal');
        const list = document.getElementById('notice-list');
        if (!modal || !list) return;
        const notices = JSON.parse(localStorage.getItem('ecmoNotices') || '[]');
        if (notices.length === 0) {
            list.innerHTML = '<div class="guideline-item">暂无新通知</div>';
        } else {
            list.innerHTML = notices.map(n => `<div class="guideline-item"><strong>${n.title || '通知'}</strong>：${n.content || ''}<div style="color:#64748b;font-size:12px;margin-top:4px;">${n.time || ''}</div></div>`).join('');
        }
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    markAllRead() {
        localStorage.setItem('ecmoNotices', '[]');
        this.showSuccess('通知已全部标记为已读');
        this.closeModalById('notice-modal');
    }

    closeModalById(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    closeModalByEl(modalEl) {
        if (modalEl) {
            modalEl.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        document.body.style.overflow = 'auto';
    }

    // ====== 页面切换与图表 ======
    showSection(sectionName) {
        // 隐藏所有区域
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // 移除所有导航项的活动状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // 显示选中的区域
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // 激活对应的导航项
        const targetNavItem = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
        if (targetNavItem) {
            targetNavItem.classList.add('active');
        }

        // 特殊处理
        if (sectionName === 'history') {
            this.loadAssessmentHistory();
        } else if (sectionName === 'knowledge') {
            this.loadKnowledge();
        } else if (sectionName === 'introduction') {
            // 图表初始化
            this.delayedInitCharts();
        }
    }

    // 延迟初始化图表，确保DOM完全渲染
    delayedInitCharts() {
        if (this.chartsInitialized) {
            return; // 如果已经初始化过，直接返回
        }

        // 检查Chart.js是否已加载
        if (typeof Chart === 'undefined') {
            console.error('Chart.js未加载，无法初始化图表');
            // 尝试重新加载Chart.js
            this.loadChartJS().then(() => {
                this.initAllCharts();
            });
            return;
        }

        // 多层延迟确保DOM完全渲染
        setTimeout(() => {
            requestAnimationFrame(() => {
                this.initAllCharts();
            });
        }, 300);
    }

    // 动态加载Chart.js
    loadChartJS() {
        return new Promise((resolve, reject) => {
            if (typeof Chart !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 初始化所有图表
    initAllCharts() {
        try {
            // 销毁已存在的图表实例
            this.destroyAllCharts();

            // 按顺序初始化图表
            this.initECMOTypesChart();
            this.initIndicationsChart();
            this.initSurvivalRateChart();
            this.initAgeSuccessChart();
            this.initComplicationsChart();
            this.initTrendChart();

            this.chartsInitialized = true;
            console.log('✅ 所有ECMO图表初始化完成');
        } catch (error) {
            console.error('❌ 图表初始化失败:', error);
        }
    }

    // 销毁所有图表实例
    destroyAllCharts() {
        Object.keys(this.chartInstances).forEach(key => {
            if (this.chartInstances[key]) {
                this.chartInstances[key].destroy();
                delete this.chartInstances[key];
            }
        });
    }

    // ECMO类型分布图表
    initECMOTypesChart() {
        const canvas = document.getElementById('ecmoTypesChart');
        if (!canvas) {
            console.warn('找不到ecmoTypesChart画布');
            return;
        }

        const ctx = canvas.getContext('2d');
        this.chartInstances.ecmoTypes = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['VV-ECMO (静脉-静脉)', 'VA-ECMO (静脉-动脉)', 'VAV-ECMO (静脉-动脉-静脉)'],
                datasets: [{
                    data: [65, 30, 5],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label}: ${context.parsed}%`
                        }
                    }
                }
            }
        });
    }

    // 适应症分布图表
    initIndicationsChart() {
        const canvas = document.getElementById('indicationsChart');
        if (!canvas) {
            console.warn('找不到indicationsChart画布');
            return;
        }

        const ctx = canvas.getContext('2d');
        this.chartInstances.indications = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['ARDS', '心源性休克', '心脏骤停', '肺栓塞', '暴发性心肌炎', '其他'],
                datasets: [{
                    data: [35, 25, 15, 10, 8, 7],
                    backgroundColor: ['#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#6b7280'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 10,
                            font: { size: 10 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label}: ${context.parsed}%`
                        }
                    }
                }
            }
        });
    }

    // 生存率图表
    initSurvivalRateChart() {
        const canvas = document.getElementById('survivalRateChart');
        if (!canvas) {
            console.warn('找不到survivalRateChart画布');
            return;
        }

        const ctx = canvas.getContext('2d');
        this.chartInstances.survivalRate = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['ARDS', '心源性休克', '心脏骤停', '肺栓塞', '暴发性心肌炎'],
                datasets: [{
                    label: '生存率 (%)',
                    data: [65, 45, 35, 70, 75],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                    borderColor: ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: (value) => value + '%'
                        },
                        title: {
                            display: true,
                            text: '生存率 (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '疾病类型'
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `生存率: ${context.parsed.y}%`
                        }
                    }
                }
            }
        });
    }

    // 年龄组别成功率图表
    initAgeSuccessChart() {
        const canvas = document.getElementById('ageSuccessChart');
        if (!canvas) {
            console.warn('找不到ageSuccessChart画布');
            return;
        }

        const ctx = canvas.getContext('2d');
        this.chartInstances.ageSuccess = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['0-18岁', '19-30岁', '31-45岁', '46-60岁', '61-70岁', '70岁以上'],
                datasets: [{
                    label: '成功率',
                    data: [75, 80, 70, 65, 55, 40],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: (value) => value + '%'
                        },
                        title: {
                            display: true,
                            text: '成功率 (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '年龄组'
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `成功率: ${context.parsed.y}%`
                        }
                    }
                }
            }
        });
    }

    // 并发症发生率图表
    initComplicationsChart() {
        const canvas = document.getElementById('complicationsChart');
        if (!canvas) {
            console.warn('找不到complicationsChart画布');
            return;
        }

        const ctx = canvas.getContext('2d');
        this.chartInstances.complications = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['出血', '感染', '血栓形成', '神经系统', '肾功能损害', '机械故障', '肢体缺血'],
                datasets: [{
                    label: '发生率 (%)',
                    data: [40, 25, 20, 15, 18, 8, 12],
                    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899'],
                    borderColor: ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#7c3aed', '#db2777'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 50,
                        ticks: {
                            callback: (value) => value + '%'
                        },
                        title: {
                            display: true,
                            text: '发生率 (%)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '并发症类型'
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label}: ${context.parsed.x}%`
                        }
                    }
                }
            }
        });
    }

    // 发展趋势图表
    initTrendChart() {
        const canvas = document.getElementById('trendChart');
        if (!canvas) {
            console.warn('找不到trendChart画布');
            return;
        }

        const ctx = canvas.getContext('2d');
        this.chartInstances.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
                datasets: [
                    {
                        label: '全球ECMO应用量',
                        data: [8500, 9200, 10800, 12500, 14200, 18500, 22000, 25500, 28000, 31000],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.3,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    },
                    {
                        label: '中国ECMO应用量',
                        data: [450, 580, 720, 950, 1200, 1800, 2500, 3200, 3800, 4500],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.3,
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '应用量 (例次)'
                        },
                        ticks: {
                            callback: (value) => value.toLocaleString()
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '年份'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString()} 例次`
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    setDefaultValues() {
        const defaults = {
            heartRate: 100,
            systolicBP: 90,
            diastolicBP: 60,
            temperature: 37.0,
            respiratoryRate: 25,
            oxygenSaturation: 85,
            ph: 7.25,
            pco2: 45,
            po2: 60,
            hco3: 18,
            lactate: 4.5,
            ejectionFraction: 25,
            glasgowComaScale: 10
        };

        Object.keys(defaults).forEach(key => {
            const element = document.getElementById(key);
            if (element && !element.value) {
                element.value = defaults[key];
            }
        });
    }

    // 处理ECMO评估
    async handleECMOAssessment() {
        const formData = this.getFormData('ecmo-form');
        this.showLoading('正在进行ECMO专业评估...');

        try {
            const response = await fetch('/api/ecmo/assess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                this.currentAssessment = result;
                this.displayAssessmentResult(result);
                this.showModal();
            } else {
                this.showError('评估失败: ' + (result.message || '未知错误'));
            }
        } catch (error) {
            console.error('评估请求失败:', error);
            this.showError('网络连接失败，请检查网络连接后重试');
        } finally {
            this.hideLoading();
        }
    }

    // 处理快速评估
    async handleQuickAssessment() {
        const formData = this.getFormData('quick-form');

        // 填充必要字段的默认值
        formData.patientId = formData.patientId || `QUICK_${Date.now()}`;
        formData.heartRate = formData.heartRate || 100;
        formData.systolicBP = formData.systolicBP || 90;
        formData.diastolicBP = formData.diastolicBP || 60;
        formData.respiratoryRate = formData.respiratoryRate || 25;
        formData.ph = formData.ph || 7.25;
        formData.paCO2 = formData.paCO2 || 45;
        formData.paO2 = formData.paO2 || formData.po2;

        const quickBtn = document.getElementById('quick-assess-btn');
        if (quickBtn) {
            quickBtn.innerHTML = '<i class="icon-loading"></i> 评估中...';
            quickBtn.disabled = true;
        }

        try {
            const response = await fetch('/api/ecmo/assess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                this.displayQuickResult(result);
            } else {
                this.showError('快速评估失败: ' + (result.message || '未知错误'));
            }
        } catch (error) {
            console.error('快速评估失败:', error);
            this.showError('网络连接失败，请检查网络连接后重试');
        } finally {
            if (quickBtn) {
                quickBtn.innerHTML = '<i class="icon-zap"></i> 快速评估';
                quickBtn.disabled = false;
            }
        }
    }

    displayQuickResult(result) {
        const quickResultDiv = document.getElementById('quick-result');
        const contentDiv = document.getElementById('quick-result-content');

        if (!quickResultDiv || !contentDiv) return;

        const riskScore = result.riskAssessment?.riskScore || 0;
        const riskLevel = result.riskAssessment?.riskLevel || '未知';
        const riskColor = result.riskAssessment?.riskColor || 'gray';

        contentDiv.innerHTML = `
            <div class="quick-result-summary">
                <div class="quick-recommendation ${riskColor}">
                    <h4>${result.ecmoResult || '评估结果'}</h4>
                    <p>${result.diagnosis || '诊断信息不可用'}</p>
                </div>
                
                <div class="quick-risk-score">
                    <h5>推荐指数</h5>
                    <div class="risk-progress-bar">
                        <div class="risk-progress-fill" style="width: ${riskScore}%; background: ${this.getRiskColor(riskScore)}"></div>
                        <div class="risk-score-text">${Math.round(riskScore)}/100</div>
                    </div>
                    <div class="risk-level ${riskColor}">${riskLevel}</div>
                </div>
                
                <div class="quick-confidence">
                    <h5>置信度: ${Math.round((result.confidence || 0) * 100)}%</h5>
                </div>
                
                <div class="quick-actions">
                    <button class="btn-primary" onclick="window.ecmoSystem.showDetailedResult()">
                        查看详细报告
                    </button>
                </div>
            </div>
        `;

        quickResultDiv.style.display = 'block';
        this.currentAssessment = result;
    }

    showDetailedResult() {
        if (this.currentAssessment) {
            this.displayAssessmentResult(this.currentAssessment);
            this.showModal();
        }
    }

    displayAssessmentResult(result) {
        const template = document.getElementById('result-template');
        const modalBody = document.getElementById('modal-body');

        if (!template || !modalBody) return;

        modalBody.innerHTML = template.innerHTML;

        // 设置核心输出
        const ecmoRecommendation = document.getElementById('ecmo-recommendation');
        const diagnosisText = document.getElementById('diagnosis-text');
        const evidenceText = document.getElementById('evidence-text');

        if (ecmoRecommendation) ecmoRecommendation.textContent = result.ecmoResult || '评估结果不可用';
        if (diagnosisText) diagnosisText.textContent = result.diagnosis || '诊断信息不可用';
        if (evidenceText) evidenceText.textContent = result.evidence || '诊断依据不可用';

        // 设置风险评分
        const riskScore = result.riskAssessment?.riskScore || 0;
        const riskLevel = result.riskAssessment?.riskLevel || '未评估';
        const riskColor = result.riskAssessment?.riskColor || 'gray';

        const riskProgressFill = document.getElementById('risk-progress-fill');
        const riskScoreValue = document.getElementById('risk-score-value');
        const riskLevelBadge = document.getElementById('risk-level-badge');

        if (riskProgressFill && riskScoreValue && riskLevelBadge) {
            riskProgressFill.style.width = `${riskScore}%`;
            riskProgressFill.style.background = this.getRiskGradientColor(riskScore);
            riskScoreValue.textContent = Math.round(riskScore * 10) / 10;
            riskLevelBadge.textContent = riskLevel;
            riskLevelBadge.className = `risk-level-badge ${riskColor}`;
        }

        // 设置关键风险因素
        const keyRiskList = document.getElementById('key-risk-list');
        const keyFactors = result.riskAssessment?.keyRiskFactors || ['暂无关键风险因素'];
        if (keyRiskList) {
            keyRiskList.innerHTML = keyFactors.map(factor => `<li>${factor}</li>`).join('');
        }

        // 设置置信度
        const confidence = (result.confidence || 0) * 100;
        const confidenceFill = document.getElementById('confidence-fill');
        const confidenceValue = document.getElementById('confidence-value');

        if (confidenceFill && confidenceValue) {
            confidenceFill.style.width = `${confidence}%`;
            confidenceFill.style.background = this.getConfidenceColor(confidence);
            confidenceValue.textContent = `${Math.round(confidence)}%`;
        }

        // 设置其他信息
        this.populateList('support-reasons-list', result.decisionCard?.supportReasons || ['需要进一步临床评估']);
        this.populateList('oppose-reasons-list', result.decisionCard?.opposeReasons || ['需要权衡获益风险比']);
        this.populateList('recommendations-list', result.recommendations || ['请咨询ECMO专科医生']);
        this.populateGuidelines(result.decisionCard?.guidelineReferences || {});
        this.populateDetailedScores(result.detailedScores || {});
    }

    getRiskGradientColor(score) {
        if (score >= 80) return 'linear-gradient(90deg, #4CAF50, #8BC34A)';
        else if (score >= 60) return 'linear-gradient(90deg, #FF9800, #FFC107)';
        else return 'linear-gradient(90deg, #F44336, #FF5722)';
    }

    getRiskColor(score) {
        if (score >= 80) return '#4CAF50';
        else if (score >= 60) return '#FF9800';
        else return '#F44336';
    }

    getConfidenceColor(confidence) {
        if (confidence >= 85) return '#4CAF50';
        else if (confidence >= 70) return '#2196F3';
        else if (confidence >= 50) return '#FF9800';
        else return '#F44336';
    }

    populateList(listId, items) {
        const list = document.getElementById(listId);
        if (list && Array.isArray(items) && items.length > 0) {
            list.innerHTML = items.map(item => `<li>${item || '信息不可用'}</li>`).join('');
        } else if (list) {
            list.innerHTML = '<li>暂无相关信息</li>';
        }
    }

    populateGuidelines(guidelines) {
        const guidelinesList = document.getElementById('guidelines-list');
        if (guidelinesList) {
            if (guidelines && Object.keys(guidelines).length > 0) {
                guidelinesList.innerHTML = Object.entries(guidelines)
                    .map(([key, value]) => `
                        <div class="guideline-item">
                            <strong>${key}:</strong> ${value || '信息不可用'}
                        </div>
                    `).join('');
            } else {
                guidelinesList.innerHTML = '<div class="guideline-item">请参考相关ECMO临床指南</div>';
            }
        }
    }

    populateDetailedScores(scores) {
        const scoresBreakdown = document.getElementById('scores-breakdown');
        if (scoresBreakdown) {
            if (scores && Object.keys(scores).length > 0) {
                scoresBreakdown.innerHTML = Object.entries(scores)
                    .map(([key, value]) => `
                        <div class="score-item">
                            <span class="score-label">${key}:</span>
                            <span class="score-value">${value || '不可用'}</span>
                        </div>
                    `).join('');
            } else {
                scoresBreakdown.innerHTML = '<div class="score-item">详细评分信息不可用</div>';
            }
        }
    }

    getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            if (['age', 'weight', 'height', 'heartRate', 'systolicBP', 'diastolicBP',
                 'temperature', 'respiratoryRate', 'oxygenSaturation', 'ph', 'pco2',
                 'po2', 'hco3', 'lactate', 'ejectionFraction', 'glasgowComaScale'].includes(key)) {
                data[key] = parseFloat(value) || null;
            } else if (['onVentilator', 'onVasopressors'].includes(key)) {
                data[key] = value === 'true';
            } else {
                data[key] = value || null;
            }
        }

        if (data.pco2) data.paCO2 = data.pco2;
        if (data.po2) data.paO2 = data.po2;
        if (data.hco3) data.bicarbonate = data.hco3;

        return data;
    }

    saveCurrentAssessment() {
        if (!this.currentAssessment) {
            this.showError('没有可保存的评估结果');
            return;
        }

        const formData = this.getFormData('ecmo-form');
        const patientId = formData.patientId || this.currentAssessment.patientId || `PATIENT_${Date.now()}`;

        const assessment = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            patientId: patientId,
            result: this.currentAssessment.ecmoResult || '评估完成',
            riskScore: this.currentAssessment.riskAssessment?.riskScore || 0,
            confidence: (this.currentAssessment.confidence || 0) * 100,
            diagnosis: this.currentAssessment.diagnosis || '诊断信息',
            data: this.currentAssessment
        };

        this.assessmentHistory.unshift(assessment);

        if (this.assessmentHistory.length > 50) {
            this.assessmentHistory = this.assessmentHistory.slice(0, 50);
        }

        localStorage.setItem('ecmoAssessments', JSON.stringify(this.assessmentHistory));
        this.loadAssessmentHistory();
        this.showSuccess('评估结果已保存');
        this.closeModal();
    }

    deleteAssessment(assessmentId) {
        if (confirm('确定要删除这条评估记录吗？')) {
            this.assessmentHistory = this.assessmentHistory.filter(assessment => assessment.id !== assessmentId);
            localStorage.setItem('ecmoAssessments', JSON.stringify(this.assessmentHistory));
            this.loadAssessmentHistory();
            this.showSuccess('评估记录已删除');
        }
    }

    loadAssessmentHistory() {
        const historyList = document.getElementById('history-list');
        this.assessmentHistory = JSON.parse(localStorage.getItem('ecmoAssessments') || '[]');

        if (!historyList) return;

        if (this.assessmentHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="icon-history"></i>
                    <p>暂无评估记录</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = this.assessmentHistory.map(assessment => {
            const safePatientId = assessment.patientId || '未知患者';
            const safeResult = assessment.result || '评估结果';
            const safeScore = Math.round(assessment.riskScore || 0);
            const safeConfidence = Math.round(assessment.confidence || 0);
            const safeTime = new Date(assessment.timestamp).toLocaleString('zh-CN');

            return `
                <div class="history-item ${this.getRiskClass(assessment.riskScore)}">
                    <div class="history-header">
                        <div class="history-title">
                            <h4>患者ID: ${safePatientId}</h4>
                            <div class="history-date">${safeTime}</div>
                        </div>
                        <div class="history-actions">
                            <button class="btn-view" onclick="window.ecmoSystem.viewAssessment('${assessment.id}')" title="查看详情">👁️</button>
                            <button class="btn-delete" onclick="window.ecmoSystem.deleteAssessment('${assessment.id}')" title="删除">🗑️</button>
                        </div>
                    </div>
                    <div class="history-summary">
                        <div class="history-metric">
                            <div class="history-metric-label">评估结果</div>
                            <div class="history-metric-value">${safeResult}</div>
                        </div>
                        <div class="history-metric">
                            <div class="history-metric-label">推荐指数</div>
                            <div class="history-metric-value">${safeScore}/100</div>
                        </div>
                        <div class="history-metric">
                            <div class="history-metric-label">置信度</div>
                            <div class="history-metric-value">${safeConfidence}%</div>
                        </div>
                        <div class="history-metric">
                            <div class="history-metric-label">风险等级</div>
                            <div class="history-metric-value">
                                <span class="history-risk-badge ${this.getRiskBadgeClass(safeScore)}">
                                    ${this.getRiskLevel(safeScore)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getRiskClass(score) {
        if (score >= 80) return 'low-risk';
        else if (score >= 60) return 'medium-risk';
        else if (score >= 40) return 'high-risk';
        else return 'extreme-risk';
    }

    getRiskBadgeClass(score) {
        if (score >= 80) return 'low';
        else if (score >= 60) return 'medium';
        else if (score >= 40) return 'high';
        else return 'extreme';
    }

    getRiskLevel(score) {
        if (score >= 80) return '低风险';
        else if (score >= 60) return '中等风险';
        else if (score >= 40) return '高风险';
        else return '极高风险';
    }

    viewAssessment(assessmentId) {
        const assessment = this.assessmentHistory.find(a => a.id === assessmentId);
        if (assessment) {
            // 修复数据访问问题 - 直接使用assessment对象，不是assessment.data
            this.currentAssessment = assessment;

            // 创建适合displayAssessmentResult的数据结构
            const resultData = {
                ecmoResult: assessment.result || '评估结果不可用',
                diagnosis: assessment.diagnosis || assessment.primaryDiagnosis || '诊断信息不可用',
                evidence: assessment.evidence || `基于患者年龄${assessment.age}岁、主要诊断等综合评估`,
                riskAssessment: {
                    riskScore: assessment.riskScore || 0,
                    riskLevel: this.getRiskLevel(assessment.riskScore || 0),
                    riskColor: this.getRiskBadgeClass(assessment.riskScore || 0),
                    keyRiskFactors: assessment.keyRiskFactors || ['基于临床参数的综合评估']
                },
                confidence: (assessment.confidence || 85) / 100, // 转换为0-1范围
                decisionCard: {
                    supportReasons: assessment.supportReasons || ['符合ECMO适应症标准'],
                    opposeReasons: assessment.opposeReasons || ['需要权衡获益风险比'],
                    guidelineReferences: assessment.guidelines || {}
                },
                recommendations: assessment.recommendations || ['请咨询ECMO专科医生进行详细评估'],
                detailedScores: assessment.detailedScores || {}
            };

            this.displayAssessmentResult(resultData);
            this.showModal();
        } else {
            this.showError('找不到该评估记录');
        }
    }

    // 添加缺失的showModal函数
    showModal() {
        const modal = document.getElementById('result-modal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        }
    }

    // 修复closeModal函数
    closeModal() {
        const modal = document.getElementById('result-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // 恢复背景滚动
        }
    }

    // 搜索历史记录功能
    searchHistory() {
        const query = document.getElementById('history-search')?.value.trim().toLowerCase();

        if (!query) {
            this.filteredHistory = [...this.assessmentHistory];
        } else {
            this.filteredHistory = this.assessmentHistory.filter(assessment => {
                return (assessment.patientId || '').toLowerCase().includes(query) ||
                       (assessment.result || '').toLowerCase().includes(query) ||
                       (assessment.diagnosis || '').toLowerCase().includes(query);
            });
        }

        this.updateHistoryList();
    }

    // 筛选历史记录功能
    filterHistory() {
        const riskFilter = document.getElementById('risk-filter')?.value || '';
        const dateFilter = document.getElementById('date-filter')?.value || '';

        let filtered = [...this.assessmentHistory];

        // 按风险等级筛选
        if (riskFilter) {
            filtered = filtered.filter(assessment => {
                const riskLevel = this.getRiskLevel(assessment.riskScore || 0);
                return riskLevel === riskFilter;
            });
        }

        // 按时间筛选
        if (dateFilter) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            filtered = filtered.filter(assessment => {
                const assessmentDate = new Date(assessment.timestamp);

                switch (dateFilter) {
                    case 'today':
                        return assessmentDate >= today;
                    case 'week':
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return assessmentDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                        return assessmentDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        this.filteredHistory = filtered;
        this.updateHistoryList();
    }

    // 更新历史记录列表显示
    updateHistoryList() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        const dataToShow = this.filteredHistory || this.assessmentHistory;

        if (dataToShow.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="icon-history">📋</i>
                    <p>暂无符合条件的评估记录</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = dataToShow.map(assessment => {
            const safePatientId = assessment.patientId || '未知患者';
            const safeResult = assessment.result || '评估结果';
            const safeScore = Math.round(assessment.riskScore || 0);
            const safeConfidence = Math.round(assessment.confidence || 0);
            const safeTime = new Date(assessment.timestamp).toLocaleString('zh-CN');

            return `
                <div class="history-item ${this.getRiskClass(assessment.riskScore)}">
                    <div class="history-header">
                        <div class="history-title">
                            <h4>患者ID: ${safePatientId}</h4>
                            <div class="history-date">${safeTime}</div>
                        </div>
                        <div class="history-actions">
                            <button class="btn-view" onclick="window.ecmoSystem.viewAssessment('${assessment.id}')" title="查看详情">👁️</button>
                            <button class="btn-delete" onclick="window.ecmoSystem.deleteAssessment('${assessment.id}')" title="删除">🗑️</button>
                        </div>
                    </div>
                    <div class="history-summary">
                        <div class="history-metric">
                            <div class="history-metric-label">评估结果</div>
                            <div class="history-metric-value">${safeResult}</div>
                        </div>
                        <div class="history-metric">
                            <div class="history-metric-label">推荐指数</div>
                            <div class="history-metric-value">${safeScore}/100</div>
                        </div>
                        <div class="history-metric">
                            <div class="history-metric-label">置信度</div>
                            <div class="history-metric-value">${safeConfidence}%</div>
                        </div>
                        <div class="history-metric">
                            <div class="history-metric-label">风险等级</div>
                            <div class="history-metric-value">
                                <span class="history-risk-badge ${this.getRiskBadgeClass(safeScore)}">
                                    ${this.getRiskLevel(safeScore)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 清空所有历史记录
    clearAllHistory() {
        if (confirm('确定要清空所有评估历史记录吗？此操作不可恢复。')) {
            this.assessmentHistory = [];
            this.filteredHistory = [];
            localStorage.setItem('ecmoAssessments', JSON.stringify(this.assessmentHistory));
            this.loadAssessmentHistory();
            this.showSuccess('所有历史记录已清空');
        }
    }

    // 导出评估记录（可选功能）
    exportAssessment(assessmentId) {
        const assessment = this.assessmentHistory.find(a => a.id === assessmentId);
        if (assessment) {
            const exportData = {
                patientId: assessment.patientId,
                timestamp: assessment.timestamp,
                result: assessment.result,
                diagnosis: assessment.diagnosis,
                riskScore: assessment.riskScore,
                confidence: assessment.confidence,
                detailedData: assessment.data
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ECMO评估报告_${assessment.patientId}_${new Date(assessment.timestamp).toLocaleDateString()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showSuccess('评估报告已导出');
        }
    }

    // 完善知识库加载功能
    loadKnowledge() {
        const indicationsList = document.getElementById('indications-list');
        const contraindicationsList = document.getElementById('contraindications-list');

        if (indicationsList) {
            indicationsList.innerHTML = `
                <li>严重急性呼吸衰竭: P/F比 < 80，PEEP ≥ 10cmH2O，持续6小时以上</li>
                <li>心源性休克: 药物支持下仍有血流动力学不稳定</li>
                <li>急性心肌炎伴心源性休克</li>
                <li>可逆性心肺疾病的桥接治疗</li>
                <li>心脏骤停后的神经保护</li>
                <li>高危心脏手术的预防性支持</li>
            `;
        }

        if (contraindicationsList) {
            contraindicationsList.innerHTML = `
                <li>不可逆转的严重脑损伤</li>
                <li>晚期恶性肿瘤</li>
                <li>严重免疫缺陷</li>
                <li>不可控制的出血</li>
                <li>严重多器官功能衰竭超过7天</li>
                <li>年龄>75岁（相对禁忌症）</li>
            `;
        }
    }

    // 重置表单功能
    resetForm() {
        const form = document.getElementById('ecmo-form');
        if (form) {
            form.reset();
            this.setDefaultValues();
            this.showSuccess('表单已重置');
        }
    }

    // 退出登录功能
    logout() {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('username');
            localStorage.removeItem('ecmoAssessments');
            window.location.href = '/static/login.html';
        }
    }

    // ===== 添加缺失的UI提示功能 =====

    // 显示成功提示
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // 显示错误提示
    showError(message) {
        this.showNotification(message, 'error');
    }

    // 显示加载状态
    showLoading(message) {
        // 创建或显示加载遮罩
        let loadingOverlay = document.getElementById('loading-overlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loading-overlay';
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">${message || '正在加载...'}</div>
                </div>
            `;
            document.body.appendChild(loadingOverlay);
        } else {
            loadingOverlay.querySelector('.loading-text').textContent = message || '正在加载...';
        }
        loadingOverlay.style.display = 'flex';
    }

    // 隐藏加载状态
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    // 通用通知功能
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        // 图标映射
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type] || icons.info}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(notification);

        // 自动消失
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('notification-fade-out');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000);

        // 添加点击关闭功能
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
}

// 全局函数
function showSection(section) {
    if (window.ecmoSystem) {
        window.ecmoSystem.showSection(section);
    }
}

function closeModal() {
    if (window.ecmoSystem) {
        window.ecmoSystem.closeAllModals();
    }
}

function saveAssessment() {
    if (window.ecmoSystem) {
        window.ecmoSystem.saveCurrentAssessment();
    }
}

function resetForm() {
    if (window.ecmoSystem) {
        document.getElementById('ecmo-form').reset();
        window.ecmoSystem.setDefaultValues();
        window.ecmoSystem.showSuccess('表单已重置');
    }
}

function logout() {
    localStorage.removeItem('username');
    window.location.href = '/static/login.html';
}

function deleteAssessment(assessmentId) {
    if (window.ecmoSystem) {
        window.ecmoSystem.deleteAssessment(assessmentId);
    }
}

// 初始化系统
window.addEventListener('DOMContentLoaded', () => {
    window.ecmoSystem = new ECMOExpertSystem();
});
