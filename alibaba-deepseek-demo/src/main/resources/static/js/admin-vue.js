(() => {
  const { createApp, ref, reactive, computed, onMounted, watch } = Vue;
  const { createRouter, createWebHashHistory } = VueRouter;

  // 工具函数
  const ls = {
    get(key, def) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } },
    set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  };

  // 仪表盘
  const Dashboard = {
    name: 'Dashboard',
    setup() {
      const kpis = reactive({ users: 0, assess: 0, active7: 0, avgRisk: '--' });
      const charts = { trend: null, pie: null };

      const calc = () => {
        const users = ls.get('adminUsers', []);
        const assess = ls.get('ecmoAssessments', []);
        kpis.users = users.length;
        kpis.assess = assess.length;
        const now = Date.now();
        const seven = 7*24*3600*1000;
        kpis.active7 = assess.filter(a => now - new Date(a.timestamp).getTime() <= seven).length;
        if (assess.length) {
          const avg = assess.reduce((s,a)=>s + (a.riskScore||0), 0) / assess.length;
          kpis.avgRisk = `${Math.round(avg)}/100`;
        } else kpis.avgRisk = '--';
        return { users, assess };
      };

      const initCharts = () => {
        if (typeof Chart === 'undefined') return;
        const { assess } = calc();
        // 趋势
        const map = new Map();
        assess.forEach(a => {
          const d = new Date(a.timestamp);
          const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
          map.set(key, (map.get(key)||0) + 1);
        });
        const labels = Array.from(map.keys()).sort();
        const data = labels.map(k => map.get(k));

        const elTrend = document.getElementById('dashTrend');
        if (elTrend) {
          charts.trend?.destroy?.();
          charts.trend = new Chart(elTrend.getContext('2d'), {
            type:'line',
            data:{ labels, datasets:[{ label:'评估次数', data, borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,.15)', fill:true, tension:.35, borderWidth:2 }]},
            options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{ticks:{color:'#64748b'}}, y:{ticks:{color:'#64748b'}, beginAtZero:true}} }
          });
        }
        // 饼图
        let low=0, mid=0, high=0, extreme=0;
        assess.forEach(a=>{ const s=Math.round(a.riskScore||0); if(s>=80)low++; else if(s>=60)mid++; else if(s>=40)high++; else extreme++; });
        const elPie = document.getElementById('dashPie');
        if (elPie) {
          charts.pie?.destroy?.();
          charts.pie = new Chart(elPie.getContext('2d'), {
            type:'doughnut',
            data:{ labels:['低','中','高','极高'], datasets:[{ data:[low,mid,high,extreme], backgroundColor:['#10b981','#f59e0b','#ef4444','#7f1d1d'], borderWidth:0 }] },
            options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom', labels:{color:'#334155'}}} }
          });
        }
      };

      onMounted(() => { calc(); initCharts(); });
      return { kpis };
    },
    template: `
      <div class="cards">
        <div class="card kpi">
          <div class="kpi-title">总用户数</div>
          <div class="kpi-value">{{ kpis.users }}</div>
        </div>
        <div class="card kpi">
          <div class="kpi-title">评估次数</div>
          <div class="kpi-value">{{ kpis.assess }}</div>
        </div>
        <div class="card kpi">
          <div class="kpi-title">近7日活跃</div>
          <div class="kpi-value">{{ kpis.active7 }}</div>
        </div>
        <div class="card kpi">
          <div class="kpi-title">平均风险分</div>
          <div class="kpi-value">{{ kpis.avgRisk }}</div>
        </div>
      </div>
      <div class="grid2">
        <div class="card">
          <h3>近30天评估趋势</h3>
          <div class="chart"><canvas id="dashTrend"></canvas></div>
        </div>
        <div class="card">
          <h3>风险等级占比</h3>
          <div class="chart"><canvas id="dashPie"></canvas></div>
        </div>
      </div>
    `
  };

  // 用户管理
  const Users = {
    name: 'Users',
    setup() {
      const list = ref(ls.get('adminUsers', []));
      const add = () => {
        const id = Date.now();
        list.value = [...list.value, { id, username: `doctor${list.value.length+1}`, realName:`医生${list.value.length+1}`, department:'ICU', title:'主治医师' }];
        ls.set('adminUsers', list.value);
      };
      const remove = (id) => { list.value = list.value.filter(u=>u.id!==id); ls.set('adminUsers', list.value); };
      const clearAll = () => { if(confirm('确定清空所有用户？')) { list.value = []; ls.set('adminUsers', list.value); } };
      return { list, add, remove, clearAll };
    },
    template: `
      <div class="section-head">
        <h2>用户管理</h2>
        <div class="actions">
          <button class="btn" @click="add">添加示例用户</button>
          <button class="btn danger" @click="clearAll">清空用户</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>ID</th><th>用户名</th><th>真实姓名</th><th>科室</th><th>职称</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="u in list" :key="u.id">
              <td>{{ u.id }}</td>
              <td>{{ u.username }}</td>
              <td>{{ u.realName }}</td>
              <td>{{ u.department }}</td>
              <td>{{ u.title }}</td>
              <td><button class="btn" @click="remove(u.id)">删除</button></td>
            </tr>
            <tr v-if="!list.length"><td colspan="6" class="empty">暂无数据</td></tr>
          </tbody>
        </table>
      </div>
    `
  };

  // 评估记录
  const Assessments = {
    name: 'Assessments',
    setup() {
      const list = ref(ls.get('ecmoAssessments', []));
      const reload = () => { list.value = ls.get('ecmoAssessments', []); };
      const clearAll = () => { if (confirm('确定清空所有评估记录？')) { ls.set('ecmoAssessments', []); reload(); } };
      const exportAll = () => {
        const blob = new Blob([JSON.stringify(list.value, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'ecmo_assessments_backup.json'; a.click();
        URL.revokeObjectURL(url);
      };
      return { list, clearAll, exportAll };
    },
    template: `
      <div class="section-head">
        <h2>评估记录</h2>
        <div class="actions">
          <button class="btn" @click="exportAll">导出全部</button>
          <button class="btn danger" @click="clearAll">清空记录</button>
        </div>
      </div>
      <div class="list">
        <div class="item" v-for="a in list" :key="a.id">
          <div class="item-title">患者ID：{{ a.patientId || '未知' }} ｜ 推荐指数：{{ Math.round(a.riskScore||0) }}/100</div>
          <div class="item-sub">{{ new Date(a.timestamp).toLocaleString('zh-CN') }} ｜ 诊断：{{ a.diagnosis || '--' }}</div>
        </div>
        <div class="item" v-if="!list.length">暂无评估记录</div>
      </div>
    `
  };

  // 诊疗数据库
  const Database = {
    name: 'Database',
    setup() {
      const list = ref(ls.get('ecmoKnowledge', []));
      const add = () => {
        const title = prompt('输入条目标题'); if (!title) return;
        const content = prompt('输入条目内容') || '';
        list.value = [{ title, content, time: new Date().toISOString() }, ...list.value];
        ls.set('ecmoKnowledge', list.value);
      };
      const del = (idx) => { list.value.splice(idx,1); ls.set('ecmoKnowledge', list.value); };
      const clearAll = () => { if (confirm('确定清空所有条目？')) { list.value = []; ls.set('ecmoKnowledge', list.value); } };
      return { list, add, del, clearAll };
    },
    template: `
      <div class="section-head">
        <h2>ECMO诊疗数据库</h2>
        <div class="actions">
          <button class="btn" @click="add">新增条目</button>
          <button class="btn danger" @click="clearAll">清空</button>
        </div>
      </div>
      <div class="list">
        <div class="item" v-for="(k,idx) in list" :key="idx">
          <div class="item-title">{{ k.title }}</div>
          <div class="item-sub">{{ k.content }}</div>
          <div style="margin-top:6px"><button class="btn danger" @click="del(idx)">删除</button></div>
        </div>
        <div class="item" v-if="!list.length">暂无数据</div>
      </div>
    `
  };

  // 系统设置
  const Settings = {
    name: 'Settings',
    setup() {
      const theme = ref(localStorage.getItem('adminTheme') || 'dark');
      const toggle = () => {
        theme.value = theme.value === 'dark' ? 'light' : 'dark';
        localStorage.setItem('adminTheme', theme.value);
        // 应用到文档根元素，立即切换主题
        document.documentElement.setAttribute('data-theme', theme.value);
      };
      const backup = () => {
        const data = {
          adminUsers: ls.get('adminUsers', []),
          ecmoAssessments: ls.get('ecmoAssessments', []),
          ecmoKnowledge: ls.get('ecmoKnowledge', []),
          userProfile: ls.get('userProfile', {})
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'ecmo_admin_backup.json'; a.click();
        URL.revokeObjectURL(url);
      };
      // 首次进入设置页时，同步当前主题到 data-theme
      onMounted(() => {
        document.documentElement.setAttribute('data-theme', theme.value);
      });
      return { theme, toggle, backup };
    },
    template: `
      <div class="grid2">
        <div class="card">
          <h3>外观主题</h3>
          <p>深色 / 亮色 切换</p>
          <button class="btn" @click="toggle">当前：{{ theme==='dark' ? '深色' : '亮色' }}</button>
        </div>
        <div class="card">
          <h3>数据备份</h3>
          <p>导出本地存储中的用户与评估数据</p>
          <button class="btn" @click="backup">立即备份</button>
        </div>
      </div>
    `
  };

  // 路由
  const routes = [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: Dashboard },
    { path: '/users', component: Users },
    { path: '/assessments', component: Assessments },
    { path: '/database', component: Database },
    { path: '/settings', component: Settings },
  ];
  const router = createRouter({ history: createWebHashHistory(), routes });

  // 根应用
  const app = {
    setup() {
      const ui = reactive({ userMenuOpen: false });
      const profileName = computed(() => {
        const p = ls.get('userProfile', {});
        return p.realName || localStorage.getItem('username') || '管理员';
      });
      const avatarUrl = computed(() => localStorage.getItem('avatarUrl') || '');
      const avatarStyle = computed(() => avatarUrl.value ? `background-image:url('${avatarUrl.value}');background-size:cover;background-position:center;` : '');
      const avatarFallback = computed(() => avatarUrl.value ? '' : (profileName.value?.[0] || '医'));

      const goProfile = () => { window.location.href = '/static/ecmo-expert.html'; };
      const logout = () => { localStorage.removeItem('username'); window.location.href = '/static/login.html'; };

      // 启动时读取并应用主题
      onMounted(() => {
        const t = localStorage.getItem('adminTheme') || 'dark';
        document.documentElement.setAttribute('data-theme', t);
      });

      return { ui, profileName, avatarStyle, avatarFallback, goProfile, logout };
    }
  };

  createApp(app).use(router).mount('#app');
})();
