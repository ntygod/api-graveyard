(async function () {
  // ========== 加载数据 ==========
  const resp = await fetch('data/apis.json');
  const apis = await resp.json();

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
  const $stats = document.getElementById('stats');
  const $search = document.getElementById('search');
  const $sort = document.getElementById('sort');
  const $modalOverlay = document.getElementById('modal-overlay');
  const $modalContent = document.getElementById('modal-content');
  const $modalClose = document.getElementById('modal-close');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let currentView = 'all';

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
      case 'died-desc':
        sorted.sort((a, b) => b.died.localeCompare(a.died));
        break;
      case 'died-asc':
        sorted.sort((a, b) => a.died.localeCompare(b.died));
        break;
      case 'flowers-desc':
        sorted.sort((a, b) => b.flowers - a.flowers);
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
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

    btn.classList.add('flowered');
    btn.querySelector('.flower-count').textContent = formatNumber(api.flowers);

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
      if (!killerMap[api.killedBy]) {
        killerMap[api.killedBy] = [];
      }
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

  // ========== 弹窗 ==========
  function openModal(api) {
    const hasFlowered = flowerStore[api.id] > 0;
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
      // 同步更新列表中的按钮
      const listBtn = document.querySelector(`.flower-btn[data-id="${api.id}"]`);
      if (listBtn) {
        listBtn.querySelector('.flower-count').textContent = formatNumber(api.flowers);
        listBtn.classList.add('flowered');
      }
    });

    document.getElementById('modal-share-btn').addEventListener('click', () => {
      const text = `🪦 R.I.P. ${api.name} (${api.born}-${api.died})\n\n"${api.epitaph}"\n\n死因: ${api.cause}\n凶手: ${api.killedBy}\n\n#API墓地 #RIP`;
      navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板，去分享吧！');
      }).catch(() => {
        showToast('复制失败，请手动复制');
      });
    });

    $modalOverlay.classList.add('active');
  }

  function closeModal() {
    $modalOverlay.classList.remove('active');
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
  function switchView(view) {
    currentView = view;
    $graveyard.classList.toggle('hidden', view !== 'all');
    $killerBoard.classList.toggle('hidden', view !== 'killer');
    $mostMourned.classList.toggle('hidden', view !== 'most-mourned');

    if (view === 'killer') renderKillerBoard();
    if (view === 'most-mourned') renderMostMourned();
  }

  // ========== 事件绑定 ==========
  $search.addEventListener('input', refresh);
  $sort.addEventListener('change', refresh);
  $modalClose.addEventListener('click', closeModal);
  $modalOverlay.addEventListener('click', (e) => {
    if (e.target === $modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchView(btn.dataset.filter);
    });
  });

  // ========== 初始化 ==========
  renderStats();
  refresh();
})();
