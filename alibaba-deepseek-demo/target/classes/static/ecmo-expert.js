// ECMO诊疗专家系统 JavaScript
class ECMOExpertSystem {
    constructor() {
        this.currentUser = localStorage.getItem('username') || '医生用户';
        this.currentAssessment = null;
        this.assessmentHistory = JSON.parse(localStorage.getItem('ecmoAssessments') || '[]');
        this.filteredHistory = []; // 筛选后的历史记录

        this.init();
    }

    init() {
        this.updateUsername();
        this.bindEvents();
        this.loadKnowledge();
        this.setDefaultValues();
        this.loadAssessmentHistory(); // 初始化时加载历史记录
    }

    updateUsername() {
        const usernameEl = document.getElementById('username');
        if (usernameEl) {
            usernameEl.textContent = this.currentUser;
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

        // 历史记录搜索和筛选事件
        const historySearch = document.getElementById('history-search');
        if (historySearch) {
            historySearch.addEventListener('input', () => this.searchHistory());
        }

        // 模态框关闭事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

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
        }
    }

    setDefaultValues() {
        // 设置一些合理的默认值
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

    // 处理完整ECMO评估
    async handleECMOAssessment() {
        const formData = this.getFormData('ecmo-form');
        
        // 显示加载状态
        this.showLoading('正在进行ECMO专业评估...');

        try {
            const response = await fetch('/api/ecmo/assess', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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

    // 处理快速评估（修复快速诊断功能）
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

        // 显示加载状态
        const quickBtn = document.getElementById('quick-assess-btn');
        if (quickBtn) {
            quickBtn.innerHTML = '<i class="icon-loading"></i> 评估中...';
            quickBtn.disabled = true;
        }

        try {
            const response = await fetch('/api/ecmo/assess', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
            // 恢复按钮状态
            if (quickBtn) {
                quickBtn.innerHTML = '<i class="icon-zap"></i> 快速评估';
                quickBtn.disabled = false;
            }
        }
    }

    // 显示快速评估结果
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

    // 显示详细结果
    showDetailedResult() {
        if (this.currentAssessment) {
            this.displayAssessmentResult(this.currentAssessment);
            this.showModal();
        }
    }

    // 显示评估结果（修复undefined问题和添加可视化）
    displayAssessmentResult(result) {
        const template = document.getElementById('result-template');
        const modalBody = document.getElementById('modal-body');

        if (!template || !modalBody) return;

        modalBody.innerHTML = template.innerHTML;

        // 设置核心输出（确保不会显示undefined）
        const ecmoRecommendation = document.getElementById('ecmo-recommendation');
        const diagnosisText = document.getElementById('diagnosis-text');
        const evidenceText = document.getElementById('evidence-text');

        if (ecmoRecommendation) ecmoRecommendation.textContent = result.ecmoResult || '评估结果不可用';
        if (diagnosisText) diagnosisText.textContent = result.diagnosis || '诊断信息不可用';
        if (evidenceText) evidenceText.textContent = result.evidence || '诊断依据不可用';

        // 设置风险评分可视化（解决undefined问题）
        const riskScore = result.riskAssessment?.riskScore || 0;
        const riskLevel = result.riskAssessment?.riskLevel || '未评估';
        const riskColor = result.riskAssessment?.riskColor || 'gray';
        
        // 更新风险评分进度条
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

        // 设置支持理由和反对理由
        this.populateList('support-reasons-list', result.decisionCard?.supportReasons || ['需要进一步临床评估']);
        this.populateList('oppose-reasons-list', result.decisionCard?.opposeReasons || ['需要权衡获益风险比']);
        this.populateList('recommendations-list', result.recommendations || ['请咨询ECMO专科医生']);

        // 设置指南引用
        this.populateGuidelines(result.decisionCard?.guidelineReferences || {});
        
        // 设置详细评分
        this.populateDetailedScores(result.detailedScores || {});
    }

    // 获取风险渐变颜色（绿到红可视化）
    getRiskGradientColor(score) {
        if (score >= 80) {
            return 'linear-gradient(90deg, #4CAF50, #8BC34A)'; // 绿色渐变
        } else if (score >= 60) {
            return 'linear-gradient(90deg, #FF9800, #FFC107)'; // 黄色渐变
        } else {
            return 'linear-gradient(90deg, #F44336, #FF5722)'; // 红色渐变
        }
    }

    // 获取风险颜色
    getRiskColor(score) {
        if (score >= 80) return '#4CAF50';
        else if (score >= 60) return '#FF9800';
        else return '#F44336';
    }

    // 获取置信度颜色
    getConfidenceColor(confidence) {
        if (confidence >= 85) return '#4CAF50';
        else if (confidence >= 70) return '#2196F3';
        else if (confidence >= 50) return '#FF9800';
        else return '#F44336';
    }

    // 填充列表（防止null/undefined）
    populateList(listId, items) {
        const list = document.getElementById(listId);
        if (list && Array.isArray(items) && items.length > 0) {
            list.innerHTML = items.map(item => `<li>${item || '信息不可用'}</li>`).join('');
        } else if (list) {
            list.innerHTML = '<li>暂无相关信息</li>';
        }
    }

    // 填充指南引用
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

    // 填充详细评分
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

    // 获取表单数据
    getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            // 数值字段转换
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

        // 映射字段名
        if (data.pco2) data.paCO2 = data.pco2;
        if (data.po2) data.paO2 = data.po2;
        if (data.hco3) data.bicarbonate = data.hco3;

        return data;
    }

    // 保存当前评估结果
    saveCurrentAssessment() {
        if (!this.currentAssessment) {
            this.showError('没有可保存的评估结果');
            return;
        }

        // 确保有基本的数据结构
        const formData = this.getFormData('ecmo-form');
        const patientId = formData.patientId || this.currentAssessment.patientId || `PATIENT_${Date.now()}`;

        const assessment = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            patientId: patientId,
            result: this.currentAssessment.ecmoResult || '评估完成',
            riskScore: this.currentAssessment.riskAssessment?.riskScore || 0,
            confidence: (this.currentAssessment.confidence || 0) * 100, // 转换为百分比
            diagnosis: this.currentAssessment.diagnosis || '诊断信息',
            data: this.currentAssessment
        };

        console.log('保存评估:', assessment); // 调试日志

        this.assessmentHistory.unshift(assessment);
        
        // 限制历史记录数量
        if (this.assessmentHistory.length > 50) {
            this.assessmentHistory = this.assessmentHistory.slice(0, 50);
        }
        
        localStorage.setItem('ecmoAssessments', JSON.stringify(this.assessmentHistory));

        // 立即刷新历史记录显示
        this.loadAssessmentHistory();

        this.showSuccess('评估结果已保存');
        this.closeModal();
    }

    // 删除评估记录（添加删除功能）
    deleteAssessment(assessmentId) {
        if (confirm('确定要删除这条评估记录吗？')) {
            this.assessmentHistory = this.assessmentHistory.filter(assessment => assessment.id !== assessmentId);
            localStorage.setItem('ecmoAssessments', JSON.stringify(this.assessmentHistory));
            this.loadAssessmentHistory();
            this.showSuccess('评估记录已删除');
        }
    }

    // 加载评估历史
    loadAssessmentHistory() {
        const historyList = document.getElementById('history-list');
        
        // 重新从localStorage加载数据，确保数据同步
        this.assessmentHistory = JSON.parse(localStorage.getItem('ecmoAssessments') || '[]');

        console.log('加载历史记录:', this.assessmentHistory.length, '条'); // 调试日志

        if (!historyList) {
            console.error('找不到history-list元素');
            return;
        }

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
                            <button class="btn-view" onclick="window.ecmoSystem.viewAssessment('${assessment.id}')" title="查看详情">
                                👁️
                            </button>
                            <button class="btn-delete" onclick="window.ecmoSystem.deleteAssessment('${assessment.id}')" title="删除">
                                🗑️
                            </button>
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

    // 获取风险等级类名
    getRiskClass(score) {
        if (score >= 80) return 'low-risk';
        else if (score >= 60) return 'medium-risk';
        else if (score >= 40) return 'high-risk';
        else return 'extreme-risk';
    }

    // 获取风险等级徽章类名
    getRiskBadgeClass(score) {
        if (score >= 80) return 'low';
        else if (score >= 60) return 'medium';
        else if (score >= 40) return 'high';
        else return 'extreme';
    }

    // 获取风险等级文本
    getRiskLevel(score) {
        if (score >= 80) return '低风险';
        else if (score >= 60) return '中等风险';
        else if (score >= 40) return '高风险';
        else return '极高风险';
    }

    // 查看评估详情
    viewAssessment(assessmentId) {
        const assessment = this.assessmentHistory.find(a => a.id === assessmentId);
        if (assessment) {
            this.currentAssessment = assessment.data;
            this.displayAssessmentResult(assessment.data);
            this.showModal();
        }
    }

    // 加载知识库
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

    // 显示模态框
    showModal() {
        const modal = document.getElementById('result-modal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    // 关闭模态框
    closeModal() {
        const modal = document.getElementById('result-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // 显示加载状态
    showLoading(message = '正在处理...') {
        const assessBtn = document.getElementById('assess-btn');
        if (assessBtn) {
            assessBtn.innerHTML = `<i class="icon-loading"></i> ${message}`;
            assessBtn.disabled = true;
        }
    }

    // 隐藏加载状态
    hideLoading() {
        const assessBtn = document.getElementById('assess-btn');
        if (assessBtn) {
            assessBtn.innerHTML = '<i class="icon-stethoscope"></i> 开始评估';
            assessBtn.disabled = false;
        }
    }

    // 显示错误消息
    showError(message) {
        this.showToast(message, 'error');
    }

    // 显示成功消息
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    // 显示提示消息
    showToast(message, type = 'info') {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="icon-${type === 'error' ? 'alert' : type === 'success' ? 'check' : 'info'}"></i>
                <span>${message}</span>
            </div>
        `;

        // 添加样式
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '10000',
            padding: '12px 20px',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            backgroundColor: type === 'error' ? '#f44336' : 
                           type === 'success' ? '#4caf50' : '#2196f3'
        });

        document.body.appendChild(toast);

        // 动画显示
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // 重置表单
    resetForm() {
        document.getElementById('ecmo-form').reset();
        this.setDefaultValues();
        this.showSuccess('表单已重置');
    }

    // 退出登录
    logout() {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('username');
            localStorage.removeItem('ecmoAssessments');
            window.location.href = '/static/login.html';
        }
    }

    // 搜索历史记录和筛选功能
    searchHistory() {
        const query = document.getElementById('history-search').value.trim().toLowerCase();

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

    // 筛选历史记录
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

    // 自动保存功能（可选）
    enableAutoSave() {
        // 当评估完成时自动保存
        const originalDisplayResult = this.displayAssessmentResult.bind(this);
        this.displayAssessmentResult = function(result) {
            originalDisplayResult(result);
            // 可以在这里添加自动保存逻辑
            console.log('评估结果已生成，可手动保存');
        };
    }

    // ...existing code...
}

// 全局函数（用于HTML onclick事件）
function showSection(section) {
    if (window.ecmoSystem) {
        window.ecmoSystem.showSection(section);
    }
}

function closeModal() {
    if (window.ecmoSystem) {
        window.ecmoSystem.closeModal();
    }
}

function saveAssessment() {
    if (window.ecmoSystem) {
        window.ecmoSystem.saveCurrentAssessment();
    }
}

function resetForm() {
    if (window.ecmoSystem) {
        window.ecmoSystem.resetForm();
    }
}

function logout() {
    if (window.ecmoSystem) {
        window.ecmoSystem.logout();
    }
}

function deleteAssessment(assessmentId) {
    if (window.ecmoSystem) {
        window.ecmoSystem.deleteAssessment(assessmentId);
    }
}

// 初始化系统
const ecmoSystem = new ECMOExpertSystem();

// 添加样式动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);
