(async function () {
  // ========== 语言检测 ==========
  const LANG_KEY = 'api-graveyard-lang';
  let lang = localStorage.getItem(LANG_KEY) || (navigator.language.startsWith('zh') ? 'zh' : 'en');
  let t = I18N[lang];

  // ========== 加载数据 ==========
  const suffix = lang === 'en' ? '-en' : '';
  let [apisResp, endangeredResp] = await Promise.all([
    fetch(`data/apis${suffix}.json`),
    fetch(`data/endangered${suffix}.json`)
  ]);
  let apis = await apisResp.json();
  let endangered = await endangeredResp.json();

  const FLOWER_KEY = 'api-graveyard-flowers-v2';
  const flowerStore = JSON.parse(localStorage.getItem(FLOWER_KEY) || '{}');

  apis.forEach(api => {
    if (flowerStore[api.id]) api.flowers += flowerStore[api.id];
  });

  // ========== DOM ==========
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
  const $langSwitch = document.getElementById('lang-switch');
  const filterBtns = document.querySelectorAll('.filter-btn');

  const allSections = [$graveyard, $killerBoard, $mostMourned, $endangered, $timeline, $statsView];
  const viewMap = {
    'all': $graveyard, 'killer': $killerBoard, 'most-mourned': $mostMourned,
    'endangered': $endangered, 'timeline': $timeline, 'stats': $statsView
  };

  let currentView = 'all';
  const GITHUB_REPO = 'ntygod/api-graveyard';

  // ========== 应用语言到静态 UI ==========
  function applyLang() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.getElementById('h-title').textContent = t.title;
    document.getElementById('h-subtitle').textContent = t.subtitle;
    $search.placeholder = t.searchPlaceholder;
    document.getElementById('f-all').textContent = t.filterAll;
    document.getElementById('f-killer').textContent = t.filterKiller;
    document.getElementById('f-mourned').textContent = t.filterMourned;
    document.getElementById('f-endangered').textContent = t.filterEndangered;
    document.getElementById('f-timeline').textContent = t.filterTimeline;
    document.getElementById('f-stats').textContent = t.filterStats;
    document.getElementById('s-died-desc').textContent = t.sortDiedDesc;
    document.getElementById('s-died-asc').textContent = t.sortDiedAsc;
    document.getElementById('s-flowers').textContent = t.sortFlowersDesc;
    document.getElementById('s-name').textContent = t.sortNameAsc;
    $backToTop.title = t.backToTop;
    // Submit form
    document.getElementById('submit-title').textContent = t.submitTitle;
    document.getElementById('fl-name').textContent = t.formName;
    document.getElementById('fi-name').placeholder = t.formNamePh;
    document.getElementById('fl-icon').textContent = t.formIcon;
    document.getElementById('fi-icon').placeholder = t.formIconPh;
    document.getElementById('fl-born').textContent = t.formBorn;
    document.getElementById('fi-born').placeholder = t.formBornPh;
    document.getElementById('fl-died').textContent = t.formDied;
    document.getElementById('fi-died').placeholder = t.formDiedPh;
    document.getElementById('fl-killer').textContent = t.formKiller;
    document.getElementById('fi-killer').placeholder = t.formKillerPh;
    document.getElementById('fl-cause').textContent = t.formCause;
    document.getElementById('fi-cause').placeholder = t.formCausePh;
    document.getElementById('fl-lastwords').textContent = t.formLastWords;
    document.getElementById('fi-lastwords').placeholder = t.formLastWordsPh;
    document.getElementById('fl-epitaph').textContent = t.formEpitaph;
    document.getElementById('fi-epitaph').placeholder = t.formEpitaphPh;
    document.getElementById('fl-dependents').textContent = t.formDependents;
    document.getElementById('fi-dependents').placeholder = t.formDependentsPh;
    document.getElementById('fl-tags').textContent = t.formTags;
    document.getElementById('fi-tags').placeholder = t.formTagsPh;
    document.getElementById('submit-btn').textContent = t.formSubmitBtn;
    // Footer
    document.getElementById('footer-text').textContent = t.footerText;
    document.getElementById('open-submit').textContent = t.footerLink;
    document.getElementById('footer-note').textContent = t.footerNote;
    // Lang button
    $langSwitch.textContent = lang === 'zh' ? '🇬🇧 EN' : '🇨🇳 中文';
  }

  // ========== 渲染统计 ==========
  function renderStats() {
    const totalFlowers = apis.reduce((s, a) => s + a.flowers, 0);
    const killers = new Set(apis.map(a => a.killedBy)).size;
    $stats.innerHTML = `
      <div class="stat-item"><div class="stat-number">${apis.length}</div><div class="stat-label">${t.statDead}</div></div>
      <div class="stat-item"><div class="stat-number">${endangered.length}</div><div class="stat-label">${t.statEndangered}</div></div>
      <div class="stat-item"><div class="stat-number">${killers}</div><div class="stat-label">${t.statKillers}</div></div>
      <div class="stat-item"><div class="stat-number">${formatNumber(totalFlowers)}</div><div class="stat-label">${t.statFlowers}</div></div>
    `;
  }

  // ========== 渲染墓碑 ==========
  function renderGraveyard(list) {
    $graveyard.innerHTML = '';
    if (list.length === 0) {
      $graveyard.innerHTML = `<p style="text-align:center;color:var(--text-dim);grid-column:1/-1;padding:40px;">${t.emptyState}</p>`;
      return;
    }
    list.forEach((api, i) => {
      const el = document.createElement('div');
      el.className = 'tombstone';
      el.style.animationDelay = `${i * 0.05}s`;
      const diedYear = api.died.length > 4 ? api.died.substring(0, 4) : api.died;
      const hasFlowered = flowerStore[api.id] > 0;
      el.innerHTML = `
        <span class="tombstone-icon">${api.icon}</span>
        <div class="tombstone-name">${api.name}</div>
        <div class="tombstone-dates">${api.born} — ${diedYear}</div>
        <div class="tombstone-epitaph">"${api.epitaph}"</div>
        <div class="tombstone-footer">
          <span class="tombstone-killer">☠ ${api.killedBy}</span>
          <button class="flower-btn ${hasFlowered ? 'flowered' : ''}" data-id="${api.id}">
            🌸 <span class="flower-count">${formatNumber(api.flowers)}</span>
          </button>
        </div>
      `;
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
        el.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
      });
      el.addEventListener('click', (e) => {
        if (e.target.closest('.flower-btn')) return;
        openModal(api);
      });
      el.querySelector('.flower-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        addFlower(api, el.querySelector('.flower-btn'), e);
      });
      $graveyard.appendChild(el);
    });
    observeTombstones();
  }

  // ========== 滚动触发入场 ==========
  function observeTombstones() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.tombstone').forEach(el => observer.observe(el));
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
      api.epitaph.toLowerCase().includes(q) ||
      api.cause.toLowerCase().includes(q)
    );
  }

  // ========== 献花 ==========
  let flowerCombo = 0;
  let flowerComboTimer = null;

  function addFlower(api, btn, event) {
    api.flowers++;
    flowerStore[api.id] = (flowerStore[api.id] || 0) + 1;
    localStorage.setItem(FLOWER_KEY, JSON.stringify(flowerStore));
    if (btn) {
      btn.classList.add('flowered');
      const countEl = btn.querySelector('.flower-count');
      countEl.textContent = formatNumber(api.flowers);
      countEl.classList.add('flower-count-animate');
      setTimeout(() => countEl.classList.remove('flower-count-animate'), 300);
    }
    const flower = document.createElement('span');
    flower.className = 'flower-float';
    flower.textContent = ['🌸', '🌺', '🌷', '💐', '🌹'][Math.floor(Math.random() * 5)];
    flower.style.left = event.clientX + 'px';
    flower.style.top = event.clientY + 'px';
    document.body.appendChild(flower);
    setTimeout(() => flower.remove(), 1500);
    // 爆发效果
    const emojis = ['🌸', '🌺', '🌷', '💐', '🌹', '✨'];
    for (let i = 0; i < 4; i++) {
      const burst = document.createElement('span');
      burst.className = 'flower-burst';
      burst.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      burst.style.left = event.clientX + 'px';
      burst.style.top = event.clientY + 'px';
      burst.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
      burst.style.setProperty('--dy', (Math.random() * -100 - 30) + 'px');
      burst.style.setProperty('--rot', (Math.random() * 360 - 180) + 'deg');
      document.body.appendChild(burst);
      setTimeout(() => burst.remove(), 1200);
    }
    // 连击彩蛋
    flowerCombo++;
    clearTimeout(flowerComboTimer);
    flowerComboTimer = setTimeout(() => { flowerCombo = 0; }, 3000);
    if (flowerCombo >= 10) {
      flowerCombo = 0;
      triggerFlowerRain();
      showToast(t.flowerRainToast);
    }
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

    $killerBoard.innerHTML = `<h2 style="text-align:center;color:var(--text-bright);margin-bottom:24px;font-weight:300;font-size:1.5rem;">${t.killerTitle}</h2>`;
    killers.forEach((killer, i) => {
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const el = document.createElement('div');
      el.className = 'killer-item';
      el.innerHTML = `
        <div class="killer-rank ${rankClass}">#${i + 1}</div>
        <div class="killer-info">
          <div class="killer-name">${killer.name}</div>
          <div class="killer-count">${t.killedCount(killer.count)}</div>
          <div class="killer-bar"><div class="killer-bar-fill" style="width:${(killer.count / maxCount) * 100}%"></div></div>
          <div class="killer-victims">${killer.victims.map(v => `<span class="victim-tag">${v.icon} ${v.name}</span>`).join('')}</div>
        </div>
      `;
      $killerBoard.appendChild(el);
    });
  }

  // ========== 最受哀悼 ==========
  function renderMostMourned() {
    const sorted = [...apis].sort((a, b) => b.flowers - a.flowers).slice(0, 10);
    $mostMourned.innerHTML = `<h2 style="text-align:center;color:var(--text-bright);margin-bottom:24px;font-weight:300;font-size:1.5rem;">${t.mournedTitle}</h2>`;
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
          <div class="killer-count">${formatNumber(api.flowers)} ${t.flowersUnit} · ${api.born} — ${api.died.substring(0, 4)}</div>
          <div style="margin-top:6px;font-style:italic;color:var(--text-dim);font-size:0.85rem;">"${api.epitaph}"</div>
        </div>
      `;
      el.addEventListener('click', () => openModal(api));
      list.appendChild(el);
    });
    $mostMourned.appendChild(list);
  }

  // ========== 濒危 ==========
  function renderEndangered() {
    const statusLabel = { 'deprecated': t.statusDeprecated, 'sunset-announced': t.statusSunset, 'at-risk': t.statusAtRisk };
    $endangered.innerHTML = `<div class="endangered-header"><h2>${t.endangeredTitle}</h2><p>${t.endangeredSubtitle}</p></div>`;
    [...endangered].sort((a, b) => b.severity - a.severity).forEach((item, i) => {
      const el = document.createElement('div');
      el.className = `endangered-card severity-${item.severity}`;
      el.style.animationDelay = `${i * 0.05}s`;
      el.innerHTML = `
        <div class="endangered-icon">${item.icon}</div>
        <div class="endangered-info">
          <div class="endangered-name">${item.name} <span class="status-badge ${item.status}">${statusLabel[item.status] || item.status}</span></div>
          <div class="endangered-reason">${item.reason}</div>
          <div class="endangered-meta">
            <span>${t.deadlineLabel} ${item.deadline}</span>
            <span class="endangered-alternative">${t.alternativeLabel} ${item.alternative}</span>
          </div>
          ${item._countdown ? `<div class="countdown">${t.daysUntilDeath(item._countdown)}</div>` : ''}
          <div class="endangered-meta">${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
        </div>
      `;
      $endangered.appendChild(el);
    });
  }

  // ========== 时间线 ==========
  function renderTimeline() {
    const sorted = [...apis].sort((a, b) => a.died.localeCompare(b.died));
    const yearGroups = {};
    sorted.forEach(api => {
      const year = api.died.substring(0, 4);
      if (!yearGroups[year]) yearGroups[year] = [];
      yearGroups[year].push(api);
    });
    $timeline.innerHTML = `<div class="timeline-header"><h2>${t.timelineTitle}</h2><p>${t.timelineSubtitle}</p></div><div class="timeline-container"><div class="timeline-line"></div></div>`;
    const container = $timeline.querySelector('.timeline-container');
    let idx = 0;
    Object.entries(yearGroups).forEach(([year, items]) => {
      const grp = document.createElement('div');
      grp.className = 'timeline-year-group';
      grp.innerHTML = `<div class="timeline-year"><span>${year}</span></div>`;
      items.forEach(api => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.style.animationDelay = `${idx * 0.06}s`;
        item.innerHTML = `
          <div class="timeline-dot"></div>
          <div class="timeline-card" data-id="${api.id}">
            <div class="timeline-card-header"><span class="timeline-card-icon">${api.icon}</span><span class="timeline-card-name">${api.name}</span></div>
            <div class="timeline-card-date">${api.born} — ${api.died}</div>
            <div class="timeline-card-epitaph">"${api.epitaph}"</div>
            <div class="timeline-card-killer">☠ ${api.killedBy}</div>
          </div>
        `;
        item.querySelector('.timeline-card').addEventListener('click', () => openModal(api));
        grp.appendChild(item);
        idx++;
      });
      container.appendChild(grp);
    });
  }

  // ========== 统计图表 ==========
  function renderStatsView() {
    const killerMap = {};
    apis.forEach(api => { killerMap[api.killedBy] = (killerMap[api.killedBy] || 0) + 1; });
    const killersSorted = Object.entries(killerMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const maxKills = killersSorted[0]?.[1] || 1;
    const yearMap = {};
    apis.forEach(api => { const y = api.died.substring(0, 4); yearMap[y] = (yearMap[y] || 0) + 1; });
    const yearsSorted = Object.entries(yearMap).sort((a, b) => a[0].localeCompare(b[0]));
    const maxYear = Math.max(...yearsSorted.map(y => y[1]));

    $statsView.innerHTML = `
      <div class="stats-header"><h2>${t.statsTitle}</h2></div>
      <div class="chart-row"><div class="chart-box">
        <div class="chart-title">${t.chartKillerTitle}</div>
        <div class="h-bar-chart">${killersSorted.map(([name, count]) => `
          <div class="h-bar-item"><div class="h-bar-label">${name}</div><div class="h-bar-track"><div class="h-bar-fill" style="width:${(count / maxKills) * 100}%"><span class="h-bar-value">${count}</span></div></div></div>
        `).join('')}</div>
      </div></div>
      <div class="chart-box" style="margin-top:20px;">
        <div class="chart-title">${t.chartYearTitle}</div>
        <div class="v-bar-chart">${yearsSorted.map(([year, count]) => `
          <div class="v-bar-item"><div class="v-bar-count">${count}</div><div class="v-bar-fill" style="height:${(count / maxYear) * 100}%"></div><div class="v-bar-label">${year}</div></div>
        `).join('')}</div>
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
      <div class="modal-section"><div class="modal-section-title">${t.sectionCause}</div><div class="modal-section-content">${api.cause}</div></div>
      <div class="modal-section"><div class="modal-section-title">${t.sectionLastWords}</div><div class="modal-section-content" style="font-style:italic;">"${api.lastWords}"</div></div>
      <div class="modal-section"><div class="modal-section-title">${t.sectionKiller}</div><div class="modal-section-content">☠ ${api.killedBy}</div></div>
      <div class="modal-section"><div class="modal-section-title">${t.sectionDependents}</div><div class="modal-section-content">${api.dependents}</div></div>
      <div class="modal-section"><div class="modal-section-title">${t.sectionTags}</div><div class="modal-tags">${api.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div></div>
      <div class="modal-actions">
        <button class="btn btn-flower" id="modal-flower-btn">${t.flower} (${formatNumber(api.flowers)})</button>
        <button class="btn btn-share" id="modal-share-btn">${t.shareImage}</button>
        <button class="btn btn-share" id="modal-copy-btn">${t.copyShare}</button>
      </div>
    `;
    document.getElementById('modal-flower-btn').addEventListener('click', (e) => {
      addFlower(api, null, e);
      document.getElementById('modal-flower-btn').innerHTML = `${t.flower} (${formatNumber(api.flowers)})`;
      const listBtn = document.querySelector(`.flower-btn[data-id="${api.id}"]`);
      if (listBtn) {
        const c = listBtn.querySelector('.flower-count');
        c.textContent = formatNumber(api.flowers);
        c.classList.add('flower-count-animate');
        setTimeout(() => c.classList.remove('flower-count-animate'), 300);
        listBtn.classList.add('flowered');
      }
    });
    document.getElementById('modal-share-btn').addEventListener('click', () => {
      generateShareCard(api);
    });
    document.getElementById('modal-copy-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(t.shareTemplate(api)).then(() => {
        showToast(t.copiedToast);
      }).catch(() => {
        showToast(t.copyFailToast);
      });
    });
    history.replaceState(null, '', `#/api/${api.id}`);
    $modalOverlay.classList.add('active');
  }

  // ========== 生成分享卡片 ==========
  function generateShareCard(api) {
    const canvas = document.getElementById('share-canvas');
    const ctx = canvas.getContext('2d');
    const W = 800, H = 500;

    // 背景
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#0a0a0f');
    bgGrad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 雾气效果
    const fogGrad = ctx.createRadialGradient(200, 250, 0, 200, 250, 300);
    fogGrad.addColorStop(0, 'rgba(100, 80, 140, 0.06)');
    fogGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, W, H);

    // 墓碑形状
    const stoneX = 200, stoneY = 60, stoneW = 400, stoneH = 340;
    const archR = stoneW / 2;
    ctx.beginPath();
    ctx.moveTo(stoneX, stoneY + archR);
    ctx.arcTo(stoneX, stoneY, stoneX + archR, stoneY, archR);
    ctx.arcTo(stoneX + stoneW, stoneY, stoneX + stoneW, stoneY + archR, archR);
    ctx.lineTo(stoneX + stoneW, stoneY + stoneH);
    ctx.lineTo(stoneX, stoneY + stoneH);
    ctx.closePath();
    ctx.fillStyle = '#181820';
    ctx.fill();
    ctx.strokeStyle = '#3a3a4a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 顶部渐变线
    const topGrad = ctx.createLinearGradient(stoneX, stoneY, stoneX + stoneW, stoneY);
    topGrad.addColorStop(0, 'transparent');
    topGrad.addColorStop(0.5, '#9b8fc4');
    topGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = topGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(stoneX + 40, stoneY + 80);
    ctx.lineTo(stoneX + stoneW - 40, stoneY + 80);
    ctx.stroke();

    // Icon
    ctx.font = '40px serif';
    ctx.textAlign = 'center';
    ctx.fillText(api.icon, W / 2, stoneY + 65);

    // API 名称
    ctx.font = 'bold 22px "Playfair Display", Georgia, serif';
    ctx.fillStyle = '#e8e8f0';
    ctx.textAlign = 'center';
    // 长名称截断
    let name = api.name;
    if (ctx.measureText(name).width > stoneW - 60) {
      while (ctx.measureText(name + '...').width > stoneW - 60 && name.length > 0) name = name.slice(0, -1);
      name += '...';
    }
    ctx.fillText(name, W / 2, stoneY + 115);

    // 生卒年
    const diedYear = api.died.length > 4 ? api.died.substring(0, 4) : api.died;
    ctx.font = '14px "Cascadia Code", "Fira Code", Consolas, monospace';
    ctx.fillStyle = '#6a6a7a';
    ctx.fillText(`${api.born} — ${diedYear}`, W / 2, stoneY + 142);

    // 分隔线
    ctx.strokeStyle = '#2a2a35';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(stoneX + 60, stoneY + 158);
    ctx.lineTo(stoneX + stoneW - 60, stoneY + 158);
    ctx.stroke();

    // 墓志铭
    ctx.font = 'italic 16px "Playfair Display", Georgia, serif';
    ctx.fillStyle = '#9b8fc4';
    const epitaph = `"${api.epitaph}"`;
    const epitaphLines = wrapText(ctx, epitaph, stoneW - 80);
    epitaphLines.forEach((line, i) => {
      ctx.fillText(line, W / 2, stoneY + 185 + i * 24);
    });

    // 死因
    const infoY = stoneY + 185 + epitaphLines.length * 24 + 20;
    ctx.font = '13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#8a4a4a';
    ctx.fillText(`☠ ${api.killedBy}`, W / 2, infoY);

    // 底部水印
    ctx.font = '12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#4a4a5a';
    ctx.fillText('ntygod.github.io/api-graveyard', W / 2, H - 25);

    // R.I.P.
    ctx.font = '11px "Cascadia Code", monospace';
    ctx.fillStyle = '#3a3a4a';
    ctx.fillText('R.I.P.', W / 2, stoneY + stoneH - 15);

    // 下载
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rip-${api.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t.shareImageToast);
    });
  }

  // Canvas 文字换行
  function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let current = '';
    for (const char of text) {
      const test = current + char;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = char;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines.slice(0, 3); // 最多3行
  }

  function closeModal() {
    $modalOverlay.classList.remove('active');
    const viewHash = currentView === 'all' ? '' : `#/${currentView}`;
    history.replaceState(null, '', viewHash || window.location.pathname);
  }

  // ========== 提交表单 ==========
  function openSubmitForm() { $submitOverlay.classList.add('active'); }
  function closeSubmitForm() { $submitOverlay.classList.remove('active'); }

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData($submitForm);
    const data = {
      name: fd.get('name'), icon: fd.get('icon') || '🪦', born: fd.get('born'), died: fd.get('died'),
      killedBy: fd.get('killedBy'), cause: fd.get('cause'), lastWords: fd.get('lastWords') || '(N/A)',
      epitaph: fd.get('epitaph'), dependents: fd.get('dependents') || '(Unknown)',
      tags: fd.get('tags') ? fd.get('tags').split(',').map(s => s.trim()).filter(Boolean) : []
    };
    const title = encodeURIComponent(`[讣告] ${data.name} (${data.born}-${data.died})`);
    const body = encodeURIComponent(`## ${data.icon} ${data.name}\n\n- **出生**: ${data.born}\n- **死亡**: ${data.died}\n- **凶手**: ${data.killedBy}\n\n### 死因\n${data.cause}\n\n### 遗言\n${data.lastWords}\n\n### 墓志铭\n> ${data.epitaph}\n\n### 受影响者\n${data.dependents}\n\n### 标签\n${data.tags.join(', ')}\n\n---\n*Auto-generated via API Graveyard submit form*`);
    window.open(`https://github.com/${GITHUB_REPO}/issues/new?title=${title}&body=${body}&labels=obituary`, '_blank');
    showToast(t.submitToast);
    closeSubmitForm();
    $submitForm.reset();
  }

  // ========== Toast ==========
  function showToast(msg) {
    let toast = document.querySelector('.toast');
    if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function formatNumber(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  }

  // ========== 刷新 ==========
  function refresh() {
    const q = $search.value.trim();
    renderGraveyard(sortApis(filterApis(q), $sort.value));
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
    filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === view));
    if (updateHash !== false) {
      history.replaceState(null, '', view === 'all' ? window.location.pathname : `#/${view}`);
    }
  }

  // ========== 路由 ==========
  function handleRoute() {
    const hash = window.location.hash;
    if (!hash) { switchView('all', false); return; }
    const apiMatch = hash.match(/^#\/api\/(.+)$/);
    if (apiMatch) {
      const api = apis.find(a => a.id === apiMatch[1]);
      if (api) { switchView('all', false); setTimeout(() => openModal(api), 100); return; }
    }
    const viewMatch = hash.match(/^#\/(.+)$/);
    if (viewMatch && viewMap[viewMatch[1]]) { switchView(viewMatch[1], false); return; }
    switchView('all', false);
  }

  // ========== 语言切换 ==========
  $langSwitch.addEventListener('click', () => {
    lang = lang === 'zh' ? 'en' : 'zh';
    localStorage.setItem(LANG_KEY, lang);
    window.location.reload();
  });

  // ========== 事件绑定 ==========
  $search.addEventListener('input', refresh);
  $sort.addEventListener('change', refresh);
  $modalClose.addEventListener('click', closeModal);
  $modalOverlay.addEventListener('click', (e) => { if (e.target === $modalOverlay) closeModal(); });
  $openSubmit.addEventListener('click', (e) => { e.preventDefault(); openSubmitForm(); });
  $submitClose.addEventListener('click', closeSubmitForm);
  $submitOverlay.addEventListener('click', (e) => { if (e.target === $submitOverlay) closeSubmitForm(); });
  $submitForm.addEventListener('submit', handleSubmit);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); closeSubmitForm(); } });
  filterBtns.forEach(btn => { btn.addEventListener('click', () => switchView(btn.dataset.filter)); });
  window.addEventListener('scroll', () => { $backToTop.classList.toggle('visible', window.scrollY > 400); });
  $backToTop.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  window.addEventListener('hashchange', handleRoute);

  // ========== 粒子效果 ==========
  function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 15; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (8 + Math.random() * 12) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      p.style.width = p.style.height = (1 + Math.random() * 2) + 'px';
      container.appendChild(p);
    }
  }

  // ========== 统计计数动画 ==========
  function animateCountUp() {
    document.querySelectorAll('.stat-number').forEach(el => {
      const text = el.textContent;
      const match = text.match(/^([\d.]+)([wk]?)$/);
      if (!match) return;
      const target = parseFloat(match[1]);
      const suffix = match[2];
      const duration = 1200;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const current = suffix ? (target * eased).toFixed(1) : Math.round(target * eased);
        el.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  // ========== 随机墓志铭 ==========
  const $randomEpitaph = document.getElementById('random-epitaph');
  function showRandomEpitaph() {
    const api = apis[Math.floor(Math.random() * apis.length)];
    const diedYear = api.died.substring(0, 4);
    $randomEpitaph.style.opacity = '0';
    setTimeout(() => {
      $randomEpitaph.innerHTML = `"${api.epitaph}" <span class="epitaph-source">— ${api.name}, ${diedYear}</span>`;
      $randomEpitaph.style.opacity = '0.8';
    }, 300);
  }
  $randomEpitaph.addEventListener('click', showRandomEpitaph);
  $randomEpitaph.title = t.randomEpitaphTip;

  // ========== 今日忌日 ==========
  function checkMemorial() {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayMD = `-${mm}-${dd}`;

    const memorials = apis.filter(api => api.died.endsWith(todayMD));
    if (memorials.length > 0) {
      const $banner = document.getElementById('memorial-banner');
      const lines = memorials.map(api => {
        const diedYear = parseInt(api.died.substring(0, 4));
        const years = today.getFullYear() - diedYear;
        return t.memorialBanner(api.name, years);
      });
      $banner.innerHTML = lines.join(' · ');
      $banner.classList.remove('hidden');
      // 标记对应墓碑
      memorials.forEach(api => {
        setTimeout(() => {
          const card = document.querySelector(`.flower-btn[data-id="${api.id}"]`);
          if (card) card.closest('.tombstone')?.classList.add('memorial');
        }, 500);
      });
    }
  }

  // ========== 濒危倒计时 ==========
  function addCountdowns() {
    const now = new Date();
    endangered.forEach(item => {
      if (!item.deadline || item.deadline.length < 7) return;
      const deadline = new Date(item.deadline);
      if (isNaN(deadline.getTime())) return;
      const days = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      if (days > 0) {
        item._countdown = days;
      }
    });
  }

  // ========== 花雨彩蛋 ==========
  function triggerFlowerRain() {
    const $rain = document.getElementById('flower-rain');
    $rain.classList.remove('hidden');
    $rain.innerHTML = '';
    const emojis = ['🌸', '🌺', '🌷', '💐', '🌹', '✨', '🌻', '💮'];
    for (let i = 0; i < 35; i++) {
      const drop = document.createElement('span');
      drop.className = 'rain-drop';
      drop.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      drop.style.left = Math.random() * 100 + '%';
      drop.style.animationDuration = (2 + Math.random() * 3) + 's';
      drop.style.animationDelay = (Math.random() * 1.5) + 's';
      drop.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
      $rain.appendChild(drop);
    }
    setTimeout(() => {
      $rain.classList.add('hidden');
      $rain.innerHTML = '';
    }, 5000);
  }

  // ========== 初始化 ==========
  applyLang();
  renderStats();
  handleRoute();
  createParticles();
  animateCountUp();
  showRandomEpitaph();
  checkMemorial();
  addCountdowns();
})();
