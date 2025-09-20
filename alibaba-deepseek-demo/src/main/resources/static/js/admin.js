// Admin 面板脚本（本地存储模拟数据源）
const AdminApp = {
  charts: {},

  init() {
    this.bindNav();
    this.bindUserMenu();
    this.paintKpis();
    this.renderUsers();
    this.renderAssessments();
    this.renderKnowledge();
    this.initCharts();
    this.bindSettings();
  },

  bindNav() {
    const btns = document.querySelectorAll('.nav-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sec = btn.dataset.section;
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(`section-${sec}`).classList.add('active');
        if (sec === 'dashboard') this.updateCharts();
      });
    });
  },

  bindUserMenu() {
    const trigger = document.getElementById('userMenuTrigger');
    const dropdown = document.getElementById('userDropdown');
    if (trigger && dropdown) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !trigger.contains(e.target)) dropdown.classList.remove('show');
      });
    }
    const name = localStorage.getItem('username') || '管理员';
    const nameEl = document.getElementById('adminUsername');
    if (nameEl) nameEl.textContent = name;
    const avatarUrl = localStorage.getItem('avatarUrl');
    const avatarEl = document.getElementById('adminAvatar');
    if (avatarEl && avatarUrl) {
      avatarEl.style.backgroundImage = `url('${avatarUrl}')`;
      avatarEl.style.backgroundSize = 'cover';
      avatarEl.style.backgroundPosition = 'center';
      avatarEl.textContent = '';
    }
  },

  showProfile() {
    this.toast('请前往专家系统右上角「个人资料」进行配置');
  },

  logout() {
    localStorage.removeItem('username');
    window.location.href = '/static/login.html';
  },

  // ====== 数据面板 ======
  loadAssessments() {
    try { return JSON.parse(localStorage.getItem('ecmoAssessments') || '[]'); } catch { return []; }
  },
  loadUsers() {
    // 简单模拟：从 userProfile 生成单用户 + 额外示例
    const list = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    return list;
  },

  paintKpis() {
    const assess = this.loadAssessments();
    const users = this.loadUsers();
    const kpiUsers = document.getElementById('kpiUsers');
    const kpiAssess = document.getElementById('kpiAssess');
    const kpiActive = document.getElementById('kpiActive');
    const kpiRisk = document.getElementById('kpiRisk');

    if (kpiUsers) kpiUsers.textContent = users.length.toString();
    if (kpiAssess) kpiAssess.textContent = assess.length.toString();

    // 近7日活跃：记录7天内的评估数>0则算活跃（简单口径）
    const now = Date.now();
    const seven = 7 * 24 * 60 * 60 * 1000;
    const recent = assess.filter(a => (now - new Date(a.timestamp).getTime()) <= seven).length;
    if (kpiActive) kpiActive.textContent = recent.toString();

    // 平均风险分
    const avg = assess.length ? Math.round(assess.reduce((s,a)=>s + (a.riskScore||0),0) / assess.length) : null;
    if (kpiRisk) kpiRisk.textContent = (avg != null ? `${avg}/100` : '--');
  },

  // ====== 图表 ======
  initCharts() {
    if (typeof Chart === 'undefined') return;
    const ctxTrend = document.getElementById('chartAssessTrend')?.getContext('2d');
    const ctxPie = document.getElementById('chartRiskPie')?.getContext('2d');
    if (ctxTrend) {
      this.charts.trend = new Chart(ctxTrend, {
        type: 'line',
        data: { labels: [], datasets: [{ label: '评估次数', data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.15)', fill: true, tension: .35, borderWidth: 2 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{ticks:{color:'#93a4bf'}},y:{ticks:{color:'#93a4bf'},beginAtZero:true}} }
      });
    }
    if (ctxPie) {
      this.charts.pie = new Chart(ctxPie, {
        type: 'doughnut',
        data: { labels: ['低','中','高','极高'], datasets: [{ data: [0,0,0,0], backgroundColor: ['#10b981','#f59e0b','#ef4444','#7f1d1d'], borderWidth: 0 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom', labels:{color:'#cfe1ff'}}} }
      });
    }
    this.updateCharts();
  },

  updateCharts() {
    const assess = this.loadAssessments();

    // 趋势：按日期聚合
    const map = new Map();
    assess.forEach(a => {
      const d = new Date(a.timestamp);
      const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
      map.set(key, (map.get(key)||0) + 1);
    });
    const labels = Array.from(map.keys()).sort();
    const data = labels.map(k => map.get(k));

    if (this.charts.trend) {
      this.charts.trend.data.labels = labels;
      this.charts.trend.data.datasets[0].data = data;
      this.charts.trend.update();
    }

    // 风险饼图
    let low=0, mid=0, high=0, extreme=0;
    assess.forEach(a => {
      const s = Math.round(a.riskScore || 0);
      if (s >= 80) low++; else if (s >= 60) mid++; else if (s >= 40) high++; else extreme++;
    });
    if (this.charts.pie) {
      this.charts.pie.data.datasets[0].data = [low, mid, high, extreme];
      this.charts.pie.update();
    }
  },

  // ====== 用户管理 ======
  renderUsers() {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;
    const users = this.loadUsers();
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.username||''}</td>
        <td>${u.realName||''}</td>
        <td>${u.department||''}</td>
        <td>${u.title||''}</td>
        <td>
          <button class="btn" onclick="AdminApp.removeUser(${u.id})">删除</button>
        </td>
      </tr>
    `).join('');
  },

  addDummyUser() {
    const list = this.loadUsers();
    const id = Date.now();
    list.push({ id, username: 'doctor'+(list.length+1), realName: '医生'+(list.length+1), department: 'ICU', title: '主治医师' });
    localStorage.setItem('adminUsers', JSON.stringify(list));
    this.renderUsers();
    this.paintKpis();
    this.toast('已添加示例用户');
  },

  removeUser(id) {
    const list = this.loadUsers().filter(u => u.id !== id);
    localStorage.setItem('adminUsers', JSON.stringify(list));
    this.renderUsers();
    this.paintKpis();
    this.toast('用户已删除');
  },

  clearUsers() {
    if (!confirm('确定清空所有用户？')) return;
    localStorage.setItem('adminUsers', '[]');
    this.renderUsers();
    this.paintKpis();
    this.toast('已清空用户');
  },

  // ====== 评估记录 ======
  renderAssessments() {
    const box = document.getElementById('assessList');
    if (!box) return;
    const list = this.loadAssessments();
    if (list.length === 0) { box.innerHTML = '<div class="item">暂无评估记录</div>'; return; }
    box.innerHTML = list.map(a => `
      <div class="item">
        <div class="item-title">患者ID：${a.patientId||'未知'} ｜ 推荐指数：${Math.round(a.riskScore||0)}/100</div>
        <div class="item-sub">${new Date(a.timestamp).toLocaleString('zh-CN')} ｜ 诊断：${a.diagnosis||'--'}</div>
      </div>
    `).join('');
  },

  exportAssessments() {
    const list = this.loadAssessments();
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ecmo_assessments_backup.json'; a.click();
    URL.revokeObjectURL(url);
    this.toast('已导出评估记录');
  },

  clearAssessments() {
    if (!confirm('确定清空所有评估记录？')) return;
    localStorage.setItem('ecmoAssessments', '[]');
    this.renderAssessments();
    this.paintKpis();
    this.updateCharts();
    this.toast('已清空评估记录');
  },

  // ====== 诊疗数据库（示例） ======
  renderKnowledge() {
    const box = document.getElementById('knowledgeList');
    if (!box) return;
    const data = JSON.parse(localStorage.getItem('ecmoKnowledge') || '[]');
    if (data.length === 0) { box.innerHTML = '<div class="item">暂无数据</div>'; return; }
    box.innerHTML = data.map((k, idx) => `
      <div class="item">
        <div class="item-title">${k.title||'条目'}</div>
        <div class="item-sub">${k.content||''}</div>
        <div style="margin-top:6px"><button class="btn danger" onclick="AdminApp.delKnowledge(${idx})">删除</button></div>
      </div>
    `).join('');
  },

  addKnowledge() {
    const title = prompt('输入条目标题');
    if (!title) return;
    const content = prompt('输入条目内容');
    const list = JSON.parse(localStorage.getItem('ecmoKnowledge') || '[]');
    list.unshift({ title, content, time: new Date().toISOString() });
    localStorage.setItem('ecmoKnowledge', JSON.stringify(list));
    this.renderKnowledge();
    this.toast('已添加条目');
  },

  delKnowledge(idx) {
    const list = JSON.parse(localStorage.getItem('ecmoKnowledge') || '[]');
    list.splice(idx, 1);
    localStorage.setItem('ecmoKnowledge', JSON.stringify(list));
    this.renderKnowledge();
    this.toast('已删除条目');
  },

  clearKnowledge() {
    if (!confirm('确定清空所有条目？')) return;
    localStorage.setItem('ecmoKnowledge', '[]');
    this.renderKnowledge();
    this.toast('已清空条目');
  },

  // ====== 设置 ======
  bindSettings() {
    const sw = document.getElementById('themeSwitch');
    if (!sw) return;
    const saved = localStorage.getItem('adminTheme') || 'dark';
    sw.checked = saved === 'dark' ? true : false; // 这里用反向表达制造轻微区别
    sw.addEventListener('change', () => {
      const val = sw.checked ? 'dark' : 'light';
      localStorage.setItem('adminTheme', val);
      this.toast('主题已更新');
    });
  },

  backupAll() {
    const data = {
      adminUsers: JSON.parse(localStorage.getItem('adminUsers') || '[]'),
      ecmoAssessments: JSON.parse(localStorage.getItem('ecmoAssessments') || '[]'),
      ecmoKnowledge: JSON.parse(localStorage.getItem('ecmoKnowledge') || '[]'),
      userProfile: JSON.parse(localStorage.getItem('userProfile') || '{}')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ecmo_admin_backup.json'; a.click();
    URL.revokeObjectURL(url);
    this.toast('备份完成');
  },

  // ====== 辅助 ======
  toast(message) {
    const el = document.getElementById('toast');
    const msg = document.getElementById('toastMsg');
    if (!el || !msg) return;
    msg.textContent = message;
    el.style.display = 'block';
    clearTimeout(this._t); this._t = setTimeout(()=>{ el.style.display = 'none'; }, 2500);
  }
};

window.addEventListener('DOMContentLoaded', () => AdminApp.init());

