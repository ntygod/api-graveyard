(async function () {
  // ========== 加载数据 ==========
  const [apisResp, endangeredResp] = await Promise.all([
    fetch('data/apis.json'),
    fetch('data/endangered.json')
  ]);
  const apis = await apisResp.json();
  const endangered = await endangeredResp.json();

  // 从 localStorage 读取献花记录
  const flowerStore = JSON.parse(localStorage.getItem('api-graveyard-flowers') || '{}');

  // 合并本地献花数
  apis.forEach(api => {
    if (flowerStore[api.id]) {
      api.flowers += flowerStore[api.id];
    }
  });

  // ========== DOM 引用 ==========
  const $graveyard = document.getElementById('graveyard');
  const $killerBoard = document.getElementById('killer-board');
  const $mostMourned = document.getElementById('most-mourned');
  const $endangered = document.getElementById('endangered');
  const $timeline = document.getElementById('timeline');
  const $statsView = document.getElementById('stats-view');
  const $stats = document.getElementById('stats');
  const $search = document.getElementById('search');
  const $sort = document.getElementById('sort');
  const $modalOverlay = document.getElementById('modal-overlay');
  const $modalContent = document.getElementById('modal-content');
  const $modalClose = document.getElementById('modal-close');
  const $submitOverlay = document.getElementById('submit-overlay');
  const $submitClose = document.getElementById('submit-close');
  const $submitForm = document.getElementById('submit-form');
  const $openSubmit = document.getElementById('open-submit');
  const $backToTop = document.getElementById('back-to-top');
  const filterBtns = document.querySelectorAll('.filter-btn');

  const allSections = [$graveyard, $killerBoard, $mostMourned, $endangered, $timeline, $statsView];
  const viewMap = {
    'all': $graveyard,
    'killer': $killerBoard,
    'most-mourned': $mostMourned,
    'endangered': $endangered,
    'timeline': $timeline,
    'stats': $statsView
  };

  let currentView = 'all';
  const GITHUB_REPO = 'ntygod/api-graveyard';

  // ========== 渲染统计 ==========
  function renderStats() {
    const totalFlowers = apis.reduce((s, a) => s + a.flowers, 0);
    const killers = new Set(apis.map(a => a.killedBy)).size;
    $stats.innerHTML = `
      <div class="stat-item">
        <div class="stat-number">${apis.length}</div>
        <div class="stat-label">已故 API</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">${endangered.length}</div>
        <div class="stat-label">濒危 API</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">${killers}</div>
        <div class="stat-label">杀手公司</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">${formatNumber(totalFlowers)}</div>
        <div class="stat-label">束鲜花</div>
      </div>
    `;
  }

  // ========== 渲染墓碑列表 ==========
  function renderGraveyard(list) {
    $graveyard.innerHTML = '';
    if (list.length === 0) {
      $graveyard.innerHTML = '<p style="text-align:center;color:var(--text-dim);grid-column:1/-1;padding:40px;">没有找到匹配的 API... 也许它还活着？</p>';
      return;
    }
    list.forEach((api, i) => {
      const el = document.createElement('div');
      el.className = 'tombstone';
      el.style.animationDelay = `${i * 0.05}s`;
      const bornYear = api.born;
      const diedYear = api.died.length > 4 ? api.died.substring(0, 4) : api.died;
      const hasFlowered = flowerStore[api.id] > 0;
      el.innerHTML = `
        <span class="tombstone-icon">${api.icon}</span>
        <div class="tombstone-name">${api.name}</div>
        <div class="tombstone-dates">${bornYear} — ${diedYear}</div>
        <div class="tombstone-epitaph">"${api.epitaph}"</div>
        <div class="tombstone-footer">
          <span class="tombstone-killer">☠ ${api.killedBy}</span>
          <button class="flower-btn ${hasFlowered ? 'flowered' : ''}" data-id="${api.id}">
            🌸 <span class="flower-count">${formatNumber(api.flowers)}</span>
          </button>
        </div>
      `;
      // 微光跟随鼠标
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
        el.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
      });
      el.addEventListener('click', (e) => {
        if (e.target.closest('.flower-btn')) return;
        openModal(api);
      });
      const flowerBtn = el.querySelector('.flower-btn');
      flowerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addFlower(api, flowerBtn, e);
      });
      $graveyard.appendChild(el);
    });
  }

  // ========== 排序 ==========
  function sortApis(list, method) {
    const sorted = [...list];
    switch (method) {
      case 'died-desc': sorted.sort((a, b) => b.died.localeCompare(a.died)); break;
      case 'died-asc': sorted.sort((a, b) => a.died.localeCompare(b.died)); break;
      case 'flowers-desc': sorted.sort((a, b) => b.flowers - a.flowers); break;
      case 'name-asc': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return sorted;
  }

  // ========== 搜索 ==========
  function filterApis(query) {
    if (!query) return apis;
    const q = query.toLowerCase();
    return apis.filter(api =>
      api.name.toLowerCase().includes(q) ||
      api.killedBy.toLowerCase().includes(q) ||
      api.tags.some(t => t.toLowerCase().includes(q)) ||
      api.epitaph.includes(q) ||
      api.cause.includes(q)
    );
  }

  // ========== 献花 ==========
  function addFlower(api, btn, event) {
    api.flowers++;
    flowerStore[api.id] = (flowerStore[api.id] || 0) + 1;
    localStorage.setItem('api-graveyard-flowers', JSON.stringify(flowerStore));

    if (btn) {
      btn.classList.add('flowered');
      const countEl = btn.querySelector('.flower-count');
      countEl.textContent = formatNumber(api.flowers);
      countEl.classList.add('flower-count-animate');
      setTimeout(() => countEl.classList.remove('flower-count-animate'), 300);
    }

    // 飘花动画
    const flower = document.createElement('span');
    flower.className = 'flower-float';
    flower.textContent = ['🌸', '🌺', '🌷', '💐', '🌹'][Math.floor(Math.random() * 5)];
    flower.style.left = event.clientX + 'px';
    flower.style.top = event.clientY + 'px';
    document.body.appendChild(flower);
    setTimeout(() => flower.remove(), 1500);

    renderStats();
  }

  // ========== 杀手排行榜 ==========
  function renderKillerBoard() {
    const killerMap = {};
    apis.forEach(api => {
      if (!killerMap[api.killedBy]) killerMap[api.killedBy] = [];
      killerMap[api.killedBy].push(api);
    });

    const killers = Object.entries(killerMap)
      .map(([name, victims]) => ({ name, victims, count: victims.length }))
      .sort((a, b) => b.count - a.count);

    const maxCount = killers[0]?.count || 1;

    $killerBoard.innerHTML = '<h2 style="text-align:center;color:var(--text-bright);margin-bottom:24px;font-weight:300;font-size:1.5rem;">☠ 杀手排行榜</h2>';

    killers.forEach((killer, i) => {
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const el = document.createElement('div');
      el.className = 'killer-item';
      el.innerHTML = `
        <div class="killer-rank ${rankClass}">#${i + 1}</div>
        <div class="killer-info">
          <div class="killer-name">${killer.name}</div>
          <div class="killer-count">杀死了 ${killer.count} 个 API/服务</div>
          <div class="killer-bar">
            <div class="killer-bar-fill" style="width: ${(killer.count / maxCount) * 100}%"></div>
          </div>
          <div class="killer-victims">
            ${killer.victims.map(v => `<span class="victim-tag">${v.icon} ${v.name}</span>`).join('')}
          </div>
        </div>
      `;
      $killerBoard.appendChild(el);
    });
  }

  // ========== 最受哀悼 ==========
  function renderMostMourned() {
    const sorted = [...apis].sort((a, b) => b.flowers - a.flowers).slice(0, 10);
    $mostMourned.innerHTML = '<h2 style="text-align:center;color:var(--text-bright);margin-bottom:24px;font-weight:300;font-size:1.5rem;">🌸 最受哀悼</h2>';

    const list = document.createElement('div');
    list.style.maxWidth = '700px';
    list.style.margin = '0 auto';

    sorted.forEach((api, i) => {
      const el = document.createElement('div');
      el.className = 'killer-item';
      el.style.cursor = 'pointer';
      el.innerHTML = `
        <div class="killer-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${api.icon}</div>
        <div class="killer-info">
          <div class="killer-name">${api.name}</div>
          <div class="killer-count">${formatNumber(api.flowers)} 束鲜花 · ${api.born} — ${api.died.substring(0, 4)}</div>
          <div style="margin-top:6px;font-style:italic;color:var(--text-dim);font-size:0.85rem;">"${api.epitaph}"</div>
        </div>
      `;
      el.addEventListener('click', () => openModal(api));
      list.appendChild(el);
    });

    $mostMourned.appendChild(list);
  }

  // ========== 濒危 API 区 ==========
  function renderEndangered() {
    const statusLabel = {
      'deprecated': '已弃用',
      'sunset-announced': '日落宣告',
      'at-risk': '高风险'
    };

    $endangered.innerHTML = `
      <div class="endangered-header">
        <h2>⚠️ 濒危 API 观察名单</h2>
        <p>这些 API 和服务还活着，但可能撑不了多久了</p>
      </div>
    `;

    const sorted = [...endangered].sort((a, b) => b.severity - a.severity);

    sorted.forEach((item, i) => {
      const el = document.createElement('div');
      el.className = `endangered-card severity-${item.severity}`;
      el.style.animationDelay = `${i * 0.05}s`;
      el.innerHTML = `
        <div class="endangered-icon">${item.icon}</div>
        <div class="endangered-info">
          <div class="endangered-name">
            ${item.name}
            <span class="status-badge ${item.status}">${statusLabel[item.status] || item.status}</span>
          </div>
          <div class="endangered-reason">${item.reason}</div>
          <div class="endangered-meta">
            <span>⏰ 截止: ${item.deadline}</span>
            <span class="endangered-alternative">➜ 替代: ${item.alternative}</span>
          </div>
          <div class="endangered-meta">
            ${item.tags.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
        </div>
      `;
      $endangered.appendChild(el);
    });
  }

  // ========== 时间线视图 ==========
  function renderTimeline() {
    const sorted = [...apis].sort((a, b) => a.died.localeCompare(b.died));

    // 按年份分组
    const yearGroups = {};
    sorted.forEach(api => {
      const year = api.died.substring(0, 4);
      if (!yearGroups[year]) yearGroups[year] = [];
      yearGroups[year].push(api);
    });

    $timeline.innerHTML = `
      <div class="timeline-header">
        <h2>📅 API 死亡时间线</h2>
        <p>从最早到最近，见证 API 的消逝</p>
      </div>
      <div class="timeline-container">
        <div class="timeline-line"></div>
      </div>
    `;

    const container = $timeline.querySelector('.timeline-container');
    let itemIndex = 0;

    Object.entries(yearGroups).forEach(([year, items]) => {
      const yearEl = document.createElement('div');
      yearEl.className = 'timeline-year-group';

      const yearLabel = document.createElement('div');
      yearLabel.className = 'timeline-year';
      yearLabel.innerHTML = `<span>${year}</span>`;
      yearEl.appendChild(yearLabel);

      items.forEach((api) => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.style.animationDelay = `${itemIndex * 0.06}s`;
        item.innerHTML = `
          <div class="timeline-dot"></div>
          <div class="timeline-card" data-id="${api.id}">
            <div class="timeline-card-header">
              <span class="timeline-card-icon">${api.icon}</span>
              <span class="timeline-card-name">${api.name}</span>
            </div>
            <div class="timeline-card-date">${api.born} — ${api.died}</div>
            <div class="timeline-card-epitaph">"${api.epitaph}"</div>
            <div class="timeline-card-killer">☠ ${api.killedBy}</div>
          </div>
        `;
        item.querySelector('.timeline-card').addEventListener('click', () => openModal(api));
        yearEl.appendChild(item);
        itemIndex++;
      });

      container.appendChild(yearEl);
    });
  }

  // ========== 统计图表 ==========
  function renderStatsView() {
    // 按公司统计
    const killerMap = {};
    apis.forEach(api => {
      killerMap[api.killedBy] = (killerMap[api.killedBy] || 0) + 1;
    });
    const killersSorted = Object.entries(killerMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const maxKills = killersSorted[0]?.[1] || 1;

    // 按年份统计
    const yearMap = {};
    apis.forEach(api => {
      const year = api.died.substring(0, 4);
      yearMap[year] = (yearMap[year] || 0) + 1;
    });
    const yearsSorted = Object.entries(yearMap).sort((a, b) => a[0].localeCompare(b[0]));
    const maxYear = Math.max(...yearsSorted.map(y => y[1]));

    $statsView.innerHTML = `
      <div class="stats-header">
        <h2>📊 数据统计</h2>
      </div>
      <div class="chart-row">
        <div class="chart-box">
          <div class="chart-title">☠ 公司杀死 API 数量 TOP 10</div>
          <div class="h-bar-chart">
            ${killersSorted.map(([name, count]) => `
              <div class="h-bar-item">
                <div class="h-bar-label">${name}</div>
                <div class="h-bar-track">
                  <div class="h-bar-fill" style="width: ${(count / maxKills) * 100}%">
                    <span class="h-bar-value">${count}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="chart-box" style="margin-top:20px;">
        <div class="chart-title">📅 各年份 API 死亡数量</div>
        <div class="v-bar-chart">
          ${yearsSorted.map(([year, count]) => `
            <div class="v-bar-item">
              <div class="v-bar-count">${count}</div>
              <div class="v-bar-fill" style="height: ${(count / maxYear) * 100}%"></div>
              <div class="v-bar-label">${year}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ========== 弹窗 ==========
  function openModal(api) {
    $modalContent.innerHTML = `
      <span class="modal-icon">${api.icon}</span>
      <div class="modal-name">${api.name}</div>
      <div class="modal-dates">⚰ ${api.born} — ${api.died}</div>

      <div class="modal-epitaph">"${api.epitaph}"</div>

      <div class="modal-section">
        <div class="modal-section-title">死因</div>
        <div class="modal-section-content">${api.cause}</div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">遗言</div>
        <div class="modal-section-content" style="font-style:italic;">"${api.lastWords}"</div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">凶手</div>
        <div class="modal-section-content">☠ ${api.killedBy}</div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">受影响者</div>
        <div class="modal-section-content">${api.dependents}</div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">标签</div>
        <div class="modal-tags">
          ${api.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-flower" id="modal-flower-btn">
          🌸 献花 (${formatNumber(api.flowers)})
        </button>
        <button class="btn btn-share" id="modal-share-btn">
          📋 复制分享
        </button>
      </div>
    `;

    document.getElementById('modal-flower-btn').addEventListener('click', (e) => {
      addFlower(api, null, e);
      document.getElementById('modal-flower-btn').innerHTML = `🌸 献花 (${formatNumber(api.flowers)})`;
      const listBtn = document.querySelector(`.flower-btn[data-id="${api.id}"]`);
      if (listBtn) {
        const countEl = listBtn.querySelector('.flower-count');
        countEl.textContent = formatNumber(api.flowers);
        countEl.classList.add('flower-count-animate');
        setTimeout(() => countEl.classList.remove('flower-count-animate'), 300);
        listBtn.classList.add('flowered');
      }
    });

    document.getElementById('modal-share-btn').addEventListener('click', () => {
      const text = `🪦 R.I.P. ${api.name} (${api.born}-${api.died})\n\n"${api.epitaph}"\n\n死因: ${api.cause}\n凶手: ${api.killedBy}\n\n#API墓地 #RIP\nhttps://ntygod.github.io/api-graveyard/#/api/${api.id}`;
      navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板，去分享吧！');
      }).catch(() => {
        showToast('复制失败，请手动复制');
      });
    });

    // 更新 URL hash
    history.replaceState(null, '', `#/api/${api.id}`);
    $modalOverlay.classList.add('active');
  }

  function closeModal() {
    $modalOverlay.classList.remove('active');
    // 恢复视图 hash
    const viewHash = currentView === 'all' ? '' : `#/${currentView}`;
    history.replaceState(null, '', viewHash || window.location.pathname);
  }

  // ========== 提交表单 ==========
  function openSubmitForm() {
    $submitOverlay.classList.add('active');
  }

  function closeSubmitForm() {
    $submitOverlay.classList.remove('active');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData($submitForm);
    const data = {
      name: fd.get('name'),
      icon: fd.get('icon') || '🪦',
      born: fd.get('born'),
      died: fd.get('died'),
      killedBy: fd.get('killedBy'),
      cause: fd.get('cause'),
      lastWords: fd.get('lastWords') || '(无)',
      epitaph: fd.get('epitaph'),
      dependents: fd.get('dependents') || '(未知)',
      tags: fd.get('tags') ? fd.get('tags').split(',').map(t => t.trim()).filter(Boolean) : []
    };

    const title = encodeURIComponent(`[讣告] ${data.name} (${data.born}-${data.died})`);
    const body = encodeURIComponent(
`## ${data.icon} ${data.name}

- **出生**: ${data.born}
- **死亡**: ${data.died}
- **凶手**: ${data.killedBy}

### 死因
${data.cause}

### 遗言
${data.lastWords}

### 墓志铭
> ${data.epitaph}

### 受影响者
${data.dependents}

### 标签
${data.tags.join(', ')}

---
*通过 API 墓地提交表单自动生成*`
    );

    const issueUrl = `https://github.com/${GITHUB_REPO}/issues/new?title=${title}&body=${body}&labels=obituary`;
    window.open(issueUrl, '_blank');
    showToast('正在跳转到 GitHub，请登录后提交 Issue');
    closeSubmitForm();
    $submitForm.reset();
  }

  // ========== Toast ==========
  function showToast(msg) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ========== 工具函数 ==========
  function formatNumber(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  }

  // ========== 刷新视图 ==========
  function refresh() {
    const query = $search.value.trim();
    const sortMethod = $sort.value;
    const filtered = filterApis(query);
    const sorted = sortApis(filtered, sortMethod);
    renderGraveyard(sorted);
  }

  // ========== 视图切换 ==========
  function switchView(view, updateHash) {
    currentView = view;
    allSections.forEach(s => s.classList.add('hidden'));
    if (viewMap[view]) viewMap[view].classList.remove('hidden');

    if (view === 'all') refresh();
    if (view === 'killer') renderKillerBoard();
    if (view === 'most-mourned') renderMostMourned();
    if (view === 'endangered') renderEndangered();
    if (view === 'timeline') renderTimeline();
    if (view === 'stats') renderStatsView();

    // 更新按钮状态
    filterBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.filter === view);
    });

    // 更新 URL hash
    if (updateHash !== false) {
      const hash = view === 'all' ? '' : `#/${view}`;
      history.replaceState(null, '', hash || window.location.pathname);
    }
  }

  // ========== URL 路由 ==========
  function handleRoute() {
    const hash = window.location.hash;
    if (!hash) {
      switchView('all', false);
      return;
    }

    // #/api/xxx — 打开具体 API 弹窗
    const apiMatch = hash.match(/^#\/api\/(.+)$/);
    if (apiMatch) {
      const api = apis.find(a => a.id === apiMatch[1]);
      if (api) {
        switchView('all', false);
        setTimeout(() => openModal(api), 100);
        return;
      }
    }

    // #/view-name — 切换视图
    const viewMatch = hash.match(/^#\/(.+)$/);
    if (viewMatch && viewMap[viewMatch[1]]) {
      switchView(viewMatch[1], false);
      return;
    }

    switchView('all', false);
  }

  // ========== 事件绑定 ==========
  $search.addEventListener('input', refresh);
  $sort.addEventListener('change', refresh);
  $modalClose.addEventListener('click', closeModal);
  $modalOverlay.addEventListener('click', (e) => {
    if (e.target === $modalOverlay) closeModal();
  });

  $openSubmit.addEventListener('click', (e) => {
    e.preventDefault();
    openSubmitForm();
  });
  $submitClose.addEventListener('click', closeSubmitForm);
  $submitOverlay.addEventListener('click', (e) => {
    if (e.target === $submitOverlay) closeSubmitForm();
  });
  $submitForm.addEventListener('submit', handleSubmit);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeSubmitForm();
    }
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.filter);
    });
  });

  // 返回顶部
  window.addEventListener('scroll', () => {
    $backToTop.classList.toggle('visible', window.scrollY > 400);
  });
  $backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // hash 变化
  window.addEventListener('hashchange', handleRoute);

  // ========== 初始化 ==========
  renderStats();
  handleRoute();
})();
