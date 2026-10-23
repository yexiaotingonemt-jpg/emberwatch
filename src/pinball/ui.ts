import { PinballModel, TOWERS, PERKS, type TowerType } from './model';

export interface UIActions {
  build: (type: TowerType) => void;
  startWave: () => void;
  launch: () => void;
  pause: () => void;
  upgrade: () => void;
  sell: () => void;
  overdrive: () => void;
  restart: () => void;
  choosePerk: (id: string) => void;
  toggleSound: () => void;
  cancel: () => void;
  setAim: (delta: number) => void;
}

const TYPES: TowerType[] = ['fire', 'frost', 'storm', 'prism'];
const svg = (paths: string, cls = '') => `<svg class="${cls}" viewBox="0 0 40 40" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
const icons = {
  fire: svg('<path d="M21 3c2 9-7 10-3 18 2-1 5-4 5-8 9 7 10 11 8 17-3 9-19 10-23 0-4-10 5-16 6-22 1 5 3 6 3 6s5-5 4-11Z" fill="currentColor" opacity=".18"/><path d="M21 3c2 9-7 10-3 18 2-1 5-4 5-8 9 7 10 11 8 17-3 9-19 10-23 0-4-10 5-16 6-22 1 5 3 6 3 6s5-5 4-11Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M20 25c-7 6-5 10 0 10s7-4 0-10Z" fill="currentColor"/>'),
  frost: svg('<path d="m20 4 13 8v16l-13 8-13-8V12Z" fill="currentColor" opacity=".12"/><path d="M20 3v34M5 11l30 18M5 29l30-18M15 6l5 5 5-5M15 34l5-5 5 5M5 16l7-1-2-7M30 32l-2-7 7-1M5 24l7 1-2 7M30 8l-2 7 7 1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="20" r="4" fill="currentColor"/>'),
  storm: svg('<path d="M24 2 7 23h12l-3 15 18-23H21l3-13Z" fill="currentColor" opacity=".18"/><path d="M24 2 7 23h12l-3 15 18-23H21l3-13Z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="m6 6 3 3M34 31l3 3M3 34l4-4M32 4l-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'),
  prism: svg('<path d="m20 3 16 26-16 9L4 29 20 3Z" fill="currentColor" opacity=".16"/><path d="m20 3 16 26-16 9L4 29 20 3Zm0 0v35M4 29l16-8 16 8M20 21V3" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m1 13 7 3m24 0 7-3M1 23h5m28 0h5" stroke="currentColor" stroke-width="1.8"/>'),
  pinball: svg('<path d="m6 32 12-12m5-7L34 2M4 21l7-7M19 35l7-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="23" cy="20" r="11" fill="currentColor" opacity=".18"/><circle cx="23" cy="20" r="11" stroke="currentColor" stroke-width="1.8"/><path d="M18 17c1-3 4-4 7-3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'),
  shield: svg('<path d="m20 4 13 5v11c0 8-8 13-13 16C15 33 7 28 7 20V9l13-5Z" stroke="currentColor" stroke-width="2"/><path d="M20 11v16m-8-8h16" stroke="currentColor" stroke-width="2"/>'),
  coin: svg('<path d="m20 4 14 8v16l-14 8-14-8V12Z" stroke="currentColor" stroke-width="1.8"/><path d="m20 10 8 5v10l-8 5-8-5V15Z" fill="currentColor" opacity=".22"/><path d="M17 16h7m-8 8h7m-3-11v14" stroke="currentColor" stroke-width="1.8"/>'),
  target: svg('<circle cx="20" cy="20" r="13" stroke="currentColor" stroke-width="1.7"/><circle cx="20" cy="20" r="6" stroke="currentColor" stroke-width="1.7"/><path d="M20 2v10m0 16v10M2 20h10m16 0h10" stroke="currentColor" stroke-width="1.7"/>'),
  link: svg('<path d="m16 24 8-8M14 27l-2 2a7 7 0 0 1-10-10l7-7a7 7 0 0 1 10 0m2 16a7 7 0 0 0 10 0l7-7a7 7 0 0 0-10-10l-2 2" transform="translate(0 -1)" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
  sound: svg('<path d="M5 15h7l9-8v26l-9-8H5V15Zm21-3c8 4 8 12 0 16m5-21c13 7 13 19 0 26" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
  muted: svg('<path d="M5 15h7l9-8v26l-9-8H5V15Zm22 0 10 10m0-10L27 25" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
  help: svg('<circle cx="20" cy="20" r="15" stroke="currentColor" stroke-width="1.8"/><path d="M15 14c0-6 11-6 11 0 0 5-6 4-6 10M20 29v1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
  pause: svg('<path d="M13 8v24M27 8v24" stroke="currentColor" stroke-width="5"/>'),
  play: svg('<path d="m12 7 21 13-21 13V7Z" fill="currentColor"/>'),
  crown: svg('<path d="m4 11 10 7L20 5l6 13 10-7-5 23H9L4 11Z" fill="currentColor" opacity=".2"/><path d="m4 11 10 7L20 5l6 13 10-7-5 23H9L4 11ZM10 28h20" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'),
};
const html = (s: unknown) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const number = (n: number) => Math.floor(n).toLocaleString('en-US');

export class PinballUI {
  private root: HTMLElement;
  private nodes: Record<string, HTMLElement> = {};
  private selectionSignature = '';
  private modal = '';
  private modalSignature = '';
  private resumeAfterModal = false;
  private soundOn = true;
  private toastTimer?: ReturnType<typeof setTimeout>;
  private previousFocus: HTMLElement | null = null;

  constructor(private model: PinballModel, private actions: UIActions) {
    this.root = document.querySelector<HTMLElement>('#app')!;
    try { this.soundOn = localStorage.getItem('pinball-sound') !== 'off'; } catch { /* Optional browser storage. */ }
    this.root.innerHTML = `
      <div class="machine-shell">
        <header class="machine-header">
          <div class="brand"><span class="brand-mark">${icons.pinball}</span><div><span class="brand-english">RICOCHET <b>BASTION</b></span><h1>弹珠防线<span>打出你的连锁反应</span></h1></div></div>
          <div class="resource-strip" aria-label="战况">
            <div class="resource hull">${icons.shield}<span><small>核心耐久</small><strong id="hp-value"></strong></span></div>
            <div class="resource gold">${icons.coin}<span><small>建设金币</small><strong id="gold-value"></strong></span></div>
            <div class="resource wave">${icons.target}<span><small>来袭波次</small><strong id="wave-value"></strong></span></div>
            <div class="resource score"><span><small>本局得分</small><strong id="score-value"></strong></span></div>
          </div>
          <nav class="utility-nav" aria-label="游戏菜单"><button id="sound-button" class="icon-button" data-action="sound" title="切换音效" aria-label="关闭音效">${this.soundOn ? icons.sound : icons.muted}</button><button class="icon-button" data-action="help" title="玩法与键位" aria-label="玩法与键位">${icons.help}</button><button id="pause-button" class="icon-button" data-action="pause" title="暂停 · P" aria-label="暂停游戏">${icons.pause}</button></nav>
        </header>

        <main class="play-layout">
          <section class="board-section" aria-label="弹珠防线战场">
            <div class="board-heading"><span class="live-status"><i></i><span id="field-status">系统就绪</span></span><span class="board-serial">TABLE 01 <i>/</i> THE REACTOR</span><span class="combo-display" id="combo-display"><b id="combo-value">0</b><small>HIT COMBO</small><i id="combo-timer"></i></span></div>
            <div class="board-well"><div class="battle-frame"><div id="battlefield" role="application" aria-label="弹珠战场。移动鼠标或手指控制挡板，点击塔基建造，空格发射。"></div><div class="pause-shade" id="pause-shade" hidden><span class="pause-glyph">Ⅱ</span><span class="eyebrow">TAKE A BREATHER</span><h2>暂停一下，再打漂亮一球。</h2><button class="button primary" data-action="pause">${icons.play} 继续战斗 <kbd>P</kbd></button></div><i class="frame-corner top-left"></i><i class="frame-corner top-right"></i><i class="frame-corner bottom-left"></i><i class="frame-corner bottom-right"></i></div></div>
            <div class="wave-track"><span id="wave-state">部署阶段</span><div class="track"><i id="wave-progress"></i></div><span id="wave-count">01 / 12</span></div>
            <div class="board-controls"><button class="button primary main-action" id="main-action" data-action="main"><span class="action-icon">${icons.play}</span><span><strong id="main-label">迎战第一波</strong><small id="main-detail">已部署两座塔，随时开始</small></span><kbd>SPACE</kbd></button><button class="button overload-button" id="overdrive-button" data-action="overdrive"><span class="overload-fill" id="overdrive-fill"></span><span class="action-icon">${icons.storm}</span><span><strong>核心过载 <kbd>F</kbd></strong><small id="overdrive-detail">反弹充能 · 0%</small></span></button></div>
            <div class="paddle-guide"><span><i class="paddle-symbol"></i>鼠标 / 手指移动挡板</span><span class="aim-control"><button data-action="aim-left" aria-label="向左调整发射角度" title="左调角度 · Q">‹</button><span>发射角度 <kbd>Q</kbd> <kbd>E</kbd></span><button data-action="aim-right" aria-label="向右调整发射角度" title="右调角度 · E">›</button></span><button class="text-button" data-action="help">怎么玩 ↗</button></div>
          </section>

          <aside class="workshop" aria-label="防线工坊">
            <div class="workshop-heading"><span class="eyebrow">BUILD THE CHAIN REACTION</span><h2>把塔连起来。<br><span>让弹珠燃起来。</span></h2><p>选塔 → 点亮塔基 → 弹珠碰撞触发</p></div>
            <div class="arsenal" aria-label="选择建造塔型">${TYPES.map((type, index) => `<button class="tower-card ${type}" data-action="build" data-type="${type}" aria-pressed="false"><span class="tower-icon">${icons[type]}</span><span class="tower-copy"><span class="tower-name">${html(TOWERS[type].name)}<kbd>${index + 1}</kbd></span><span class="tower-role">${html(TOWERS[type].label)}</span></span><span class="tower-cost"><b>${TOWERS[type].cost}</b><small>金币</small></span></button>`).join('')}</div>
            <section class="inspector" id="selected-panel" aria-label="塔与充能详情"></section>
            <section class="link-lab" aria-label="塔联动说明"><div class="section-label">${icons.link}<h3>相邻塔，会发生化学反应</h3><span id="link-count">0 条连线</span></div><div class="synergy-recipes"><span><i class="element fire"></i><i class="element frost"></i><b>蒸汽爆破</b><small>范围爆发</small></span><span><i class="element frost"></i><i class="element storm"></i><b>冰链传导</b><small>连锁冻结</small></span><span><i class="element fire"></i><i class="element storm"></i><b>等离子弧</b><small>穿透闪电</small></span></div><p>撞塔蓄能，连线接力。棱镜塔分裂出真实弹珠。</p></section>
            <div class="next-wave"><span class="eyebrow" id="preview-label">NEXT / 01</span><p id="wave-preview"></p></div>
          </aside>
        </main>
        <footer class="machine-footer"><span>ONE BALL. A THOUSAND POSSIBILITIES.</span><span><span id="perk-count">0 项改装</span><i>·</i>最高纪录 <b id="best-value">0</b><i>·</i><button data-action="restart-confirm">重新开局</button></span></footer>
      </div><div id="toast" class="toast" role="status" aria-live="polite"></div><div id="modal-host"></div>`;
    this.root.querySelectorAll<HTMLElement>('[id]').forEach(node => this.nodes[node.id] = node);
    this.root.addEventListener('click', event => this.handleClick(event));
    document.addEventListener('keydown', event => {
      if (!this.modal) return;
      event.stopImmediatePropagation();
      if (event.key === 'Escape' && ['help', 'restart'].includes(this.modal)) { event.preventDefault(); this.closeModal(); }
      if (event.key === 'Tab') {
        const focusable = Array.from(this.nodes['modal-host'].querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { last?.focus(); event.preventDefault(); }
        else if (!event.shiftKey && document.activeElement === last) { first?.focus(); event.preventDefault(); }
      }
      if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) && !(event.key === ' ' && document.activeElement?.tagName === 'BUTTON')) event.preventDefault();
    }, true);
    this.render();
  }

  private text(id: string, value: string) {
    const node = this.nodes[id];
    if (node && node.textContent !== value) node.textContent = value;
  }

  render() {
    const m = this.model;
    const ended = m.phase === 'victory' || m.phase === 'defeat';
    this.text('hp-value', `${m.hp} / ${m.maxHp}`);
    this.text('gold-value', number(m.gold));
    this.text('wave-value', `${String(m.wave).padStart(2, '0')} / ${m.maxWaves}`);
    this.text('score-value', number(m.score));
    this.text('best-value', number(Math.max(m.bestScore, m.score)));
    this.text('perk-count', `${m.perks.length} 项改装`);
    this.text('field-status', m.paused ? '战场暂停' : m.phase === 'wave' ? '敌潮来袭 · 持续反击' : ended ? m.phase === 'victory' ? '反应堆保卫成功' : '核心失守' : m.buildType ? `选择塔基 · 部署${TOWERS[m.buildType].name}` : '部署阶段 · 构筑你的连锁');
    this.nodes['hp-value'].classList.toggle('danger', m.hp <= m.maxHp * .3);
    this.nodes['combo-display'].classList.toggle('is-live', m.combo > 1);
    this.text('combo-value', String(m.combo));
    this.nodes['combo-timer'].style.transform = `scaleX(${Math.max(0, Math.min(1, m.comboTimer / 4))})`;
    this.text('wave-state', m.phase === 'wave' ? `第 ${m.wave} 波` : ended ? '战斗结束' : '自由部署 / 升级');
    this.text('wave-count', m.phase === 'wave' ? `剩余 ${m.waveRemaining} / ${m.waveTotal}` : `下一波 ${Math.min(m.wave + 1, m.maxWaves)} / ${m.maxWaves}`);
    this.nodes['wave-progress'].style.width = `${m.phase === 'wave' && m.waveTotal ? Math.max(0, Math.min(100, (1 - m.waveRemaining / m.waveTotal) * 100)) : ended ? 100 : 0}%`;
    this.text('main-label', ended ? '本轮挑战已结束' : m.phase === 'build' ? `迎战第 ${m.wave + 1} 波` : m.ballReady ? '发射弹珠' : '接住，继续连击！');
    this.text('main-detail', m.phase === 'build' ? '自动射击守线 · 亲手反弹引爆联动' : m.ballReady ? '空格 / 点击战场 · Q E 调整角度' : `${m.balls.length} 颗弹珠在场 · 撞击塔芯触发技能`);
    (this.nodes['main-action'] as HTMLButtonElement).disabled = ended || m.paused || !!m.perkChoices.length || (m.phase === 'wave' && !m.ballReady);
    const active = m.overdriveActive > 0;
    this.nodes['overdrive-button'].classList.toggle('charged', m.overdrive >= 100);
    this.nodes['overdrive-button'].classList.toggle('active', active);
    this.nodes['overdrive-fill'].style.width = `${Math.min(100, m.overdrive)}%`;
    this.text('overdrive-detail', active ? `超频输出 · ${Math.ceil(m.overdriveActive)} 秒` : m.overdrive >= 100 ? '已充满 · 点击爆发' : `反弹充能 · ${Math.floor(m.overdrive)}%`);
    (this.nodes['overdrive-button'] as HTMLButtonElement).disabled = m.overdrive < 100 || m.paused || ended || m.phase !== 'wave';
    const pause = this.nodes['pause-button'];
    if (pause.dataset.paused !== String(m.paused)) {
      pause.innerHTML = m.paused ? icons.play : icons.pause;
      pause.dataset.paused = String(m.paused);
      pause.setAttribute('aria-label', m.paused ? '继续游戏' : '暂停游戏');
    }
    (pause as HTMLButtonElement).disabled = ended;
    this.nodes['pause-shade'].hidden = !m.paused || !!this.modal || ended;
    for (const type of TYPES) {
      const button = this.root.querySelector<HTMLButtonElement>(`[data-type="${type}"]`)!;
      button.classList.toggle('selected', m.buildType === type);
      button.classList.toggle('unaffordable', m.gold < TOWERS[type].cost);
      button.setAttribute('aria-pressed', String(m.buildType === type));
      button.disabled = ended;
    }
    this.text('link-count', `${m.links.length} 条连线`);
    this.text('preview-label', `NEXT / ${String(Math.min(m.wave + 1, m.maxWaves)).padStart(2, '0')}`);
    this.text('wave-preview', m.nextWavePreview());
    this.renderSelection();
    if (ended && !['help', 'restart'].includes(this.modal)) this.showResult();
    else if (m.perkChoices.length && !['help', 'restart'].includes(this.modal)) this.showPerks();
    else if (this.modal === 'result' || this.modal === 'perk') this.closeModal();
  }

  private renderSelection() {
    const m = this.model, t = m.selectedTower();
    const signature = JSON.stringify([m.selectedPad, m.buildType, t && [t.id, t.level, t.maxCharge], Math.floor(m.gold), m.phase, m.perks]);
    if (this.selectionSignature === signature) {
      if (t) {
        const value = this.nodes['selected-panel'].querySelector<HTMLElement>('[data-charge-value]');
        const fill = this.nodes['selected-panel'].querySelector<HTMLElement>('[data-charge-fill]');
        if (value) value.textContent = `${t.charge.toFixed(1)} / ${t.maxCharge}`;
        if (fill) fill.style.width = `${Math.min(100, t.charge / Math.max(1, t.maxCharge) * 100)}%`;
      }
      return;
    }
    this.selectionSignature = signature;
    const panel = this.nodes['selected-panel'];
    if (!t) {
      const type = m.buildType;
      panel.innerHTML = type ? `<div class="inspector-title"><span class="eyebrow">READY TO INSTALL</span><button data-action="cancel" class="text-button">取消 ×</button></div><h3 class="inspect-name ${type}">${icons[type]}${html(TOWERS[type].name)}<small>${TOWERS[type].cost} 金币</small></h3><p>${html(TOWERS[type].synergy || TOWERS[type].description)}</p><span class="placement-hint">点击场内空塔基 · 相邻自动连线</span>` : `<div class="inspector-title"><span class="eyebrow">THE BALL IS YOUR BATTERY</span>${m.selectedPad !== null ? '<button data-action="cancel" class="text-button">取消 ×</button>' : ''}</div><h3 class="inspect-name">${icons.pinball}${m.selectedPad !== null ? '空塔基，等你接通' : '你来反弹，塔来爆发'}</h3><p>${m.selectedPad !== null ? '选择上方塔型，在此部署。' : '塔会自动射击；弹珠撞塔蓄能，满格触发强力技能，并传导相邻塔。'}</p><span class="placement-hint">点击已建塔，可升级 / 查看充能</span>`;
      return;
    }
    const info = TOWERS[t.type], stats = m.stats(t), cost = m.upgradeCost(t), maxed = t.level >= 3;
    const percent = Math.min(100, t.charge / Math.max(1, t.maxCharge) * 100);
    panel.innerHTML = `<div class="inspector-title"><span class="eyebrow">TOWER INSPECTOR</span><button class="text-button" data-action="cancel" aria-label="取消选择">×</button></div><h3 class="inspect-name ${t.type}">${icons[t.type]}${html(info.name)}<small>LV. ${t.level} / 3</small></h3><div class="charge-row"><span>弹珠充能 <b data-charge-value>${t.charge.toFixed(1)} / ${t.maxCharge}</b></span><span>伤害 <b>${Math.round(stats.damage)}</b></span></div><div class="charge-track ${t.type}"><i data-charge-fill style="width:${percent}%"></i></div><div class="inspector-actions"><button class="upgrade-button" data-action="upgrade" ${maxed || m.gold < cost || m.phase === 'victory' || m.phase === 'defeat' ? 'disabled' : ''}>${maxed ? '已达最高等级' : `升级至 LV. ${t.level + 1}<b>${cost} 金币</b>`}</button><button class="sell-button" data-action="sell" title="拆除后返还 ${m.sellValue(t)} 金币">拆除 +${m.sellValue(t)}</button></div>`;
  }

  private handleClick(event: Event) {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'build') this.actions.build(button.dataset.type as TowerType);
    else if (action === 'main') this.model.phase === 'build' ? this.actions.startWave() : this.actions.launch();
    else if (action === 'pause') this.actions.pause();
    else if (action === 'overdrive') this.actions.overdrive();
    else if (action === 'upgrade') this.actions.upgrade();
    else if (action === 'sell') this.actions.sell();
    else if (action === 'cancel') this.actions.cancel();
    else if (action === 'aim-left') this.actions.setAim(-1);
    else if (action === 'aim-right') this.actions.setAim(1);
    else if (action === 'help') this.showHelp();
    else if (action === 'close') this.closeModal();
    else if (action === 'restart-confirm') this.showRestart();
    else if (action === 'restart') { this.closeModal(false); this.actions.restart(); }
    else if (action === 'perk') { this.actions.choosePerk(button.dataset.perk!); this.closeModal(); }
    else if (action === 'sound') {
      this.soundOn = !this.soundOn;
      this.actions.toggleSound();
      this.nodes['sound-button'].innerHTML = this.soundOn ? icons.sound : icons.muted;
      this.nodes['sound-button'].setAttribute('aria-label', this.soundOn ? '关闭音效' : '打开音效');
      try { localStorage.setItem('pinball-sound', this.soundOn ? 'on' : 'off'); } catch { /* Optional browser storage. */ }
    }
    this.render();
  }

  private openModal(type: string, content: string, locked = false) {
    if (!this.modal) {
      this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (this.model.phase === 'wave' && !this.model.paused) { this.actions.pause(); this.resumeAfterModal = true; }
    }
    this.modal = type;
    this.nodes['modal-host'].innerHTML = `<div class="modal-backdrop"><section class="modal ${type}-modal" role="dialog" aria-modal="true" aria-label="${type === 'help' ? '弹珠防线玩法说明' : type === 'perk' ? '选择改装' : type === 'restart' ? '重新开局' : '战斗结算'}">${locked ? '' : '<button class="modal-close" data-action="close" aria-label="关闭">×</button>'}${content}</section></div>`;
    if (!locked) this.nodes['modal-host'].querySelector('.modal-backdrop')!.addEventListener('click', event => { if (event.target === event.currentTarget) this.closeModal(); });
    this.nodes['modal-host'].querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    this.nodes['pause-shade'].hidden = true;
  }

  private closeModal(resume = true) {
    this.nodes['modal-host'].innerHTML = '';
    this.modal = '';
    this.modalSignature = '';
    if (resume && this.resumeAfterModal && this.model.paused) this.actions.pause();
    this.resumeAfterModal = false;
    this.previousFocus?.focus({ preventScroll: true });
  }

  private showHelp() {
    this.openModal('help', `<div class="modal-emblem">${icons.pinball}</div><span class="eyebrow">A LITTLE PINBALL. A LOT OF CHAIN REACTION.</span><h2>不是旁观防线，<br><span>是亲手点燃它。</span></h2><div class="help-steps"><article><b>01</b><div><h3>把弹珠接回来</h3><p>鼠标 / 手指控制挡板，A D 或方向键也能移动。打在挡板两侧，反弹方向更斜；移动挡板接球，还能为球加速。别让球落入底部。</p></div></article><article><b>02</b><div><h3>把塔连成一台机器</h3><p>选择塔型，再点击空塔基建造。塔自动射击，弹珠撞塔会蓄能。满能触发强力脉冲，还会给相邻塔传导能量；不同元素连线，打出蒸汽、冰链与等离子弧。</p></div></article><article><b>03</b><div><h3>把一球打成一场风暴</h3><p>棱镜塔能分裂弹珠，最多同时 5 颗。保持碰撞积累连击与过载能量，按 F 短时爆发。波次之间选改装，让整套防线越战越强。守住全部 ${this.model.maxWaves} 波。</p></div></article></div><div class="key-guide"><span><kbd>SPACE</kbd> 迎战 / 发射</span><span><kbd>Q</kbd><kbd>E</kbd> 发射角度</span><span><kbd>1</kbd>–<kbd>4</kbd> 选择塔</span><span><kbd>F</kbd> 核心过载</span><span><kbd>P</kbd> 暂停</span><span><kbd>ESC</kbd> 取消建造</span></div><button class="button primary modal-primary" data-action="close">下一球，打出连锁 →</button>`);
  }

  private showRestart() {
    this.openModal('restart', `<span class="eyebrow">A NEW CHAIN REACTION</span><h2>重新构筑防线？</h2><p class="modal-intro">本轮进度将重置，最高得分会保留。</p><div class="result-actions"><button class="button primary" data-action="restart">重新开局</button><button class="button secondary" data-action="close">继续本轮</button></div>`);
  }

  private showPerks() {
    const signature = this.model.perkChoices.join(',');
    if (this.modal === 'perk' && this.modalSignature === signature) return;
    this.openModal('perk', `<div class="modal-emblem">${icons.prism}</div><span class="eyebrow">THE MACHINE EVOLVES</span><h2>下一次反弹，<br><span>会更不一样。</span></h2><p class="modal-intro">选择一项永久改装，为本轮防线注入新的可能。</p><div class="perk-options">${this.model.perkChoices.map((id, i) => `<button class="perk-option" data-action="perk" data-perk="${html(id)}"><span class="perk-number">MOD / 0${i + 1}</span><span class="perk-symbol">${[icons.storm, icons.prism, icons.fire][i % 3]}</span><strong>${html(PERKS[id].name)}</strong><small>${html(PERKS[id].description)}</small><span class="perk-select">安装改装 <b>↗</b></span></button>`).join('')}</div><p class="modal-note">立即生效 · 效果可与已有改装叠加</p>`, true);
    this.modalSignature = signature;
  }

  private showResult() {
    const m = this.model, victory = m.phase === 'victory';
    const signature = `${m.phase}-${m.score}-${m.wave}`;
    if (this.modal === 'result' && this.modalSignature === signature) return;
    const elapsed = `${Math.floor(m.runTime / 60)}:${String(Math.floor(m.runTime % 60)).padStart(2, '0')}`;
    this.openModal('result', `<div class="modal-emblem ${victory ? '' : 'fallen'}">${victory ? icons.crown : icons.shield}</div><span class="eyebrow">${victory ? 'WHAT A BEAUTIFUL CHAIN REACTION' : 'EVERY GREAT RUN STARTS WITH ONE MORE BALL'}</span><h2>${victory ? '防线没倒，<br><span>连锁还在继续。</span>' : '这一球落下，<br><span>下一球再赢回来。</span>'}</h2><p class="modal-intro">${victory ? `全部 ${m.maxWaves} 波已击退。你把一颗弹珠，打成了整座要塞的心跳。` : `坚守至第 ${m.wave} 波。试着让不同元素塔相邻，把满能脉冲接力起来。`}</p><div class="result-score"><small>FINAL SCORE</small><strong>${number(m.score)}</strong><span>${m.score >= m.bestScore ? '本机最高纪录' : `本机纪录 ${number(m.bestScore)}`}</span></div><div class="result-stats"><span>最高连击<strong>${m.bestCombo}<small> HIT</small></strong></span><span>击退敌人<strong>${m.kills}</strong></span><span>战斗用时<strong>${elapsed}</strong></span></div><div class="result-actions"><button class="button primary" data-action="restart">${icons.pinball}再来一局</button><button class="button secondary" data-action="help">研究联动</button></div>`, true);
    this.modalSignature = signature;
  }

  toast(message: string) {
    clearTimeout(this.toastTimer);
    this.nodes.toast.textContent = message;
    this.nodes.toast.classList.add('visible');
    this.toastTimer = setTimeout(() => this.nodes.toast.classList.remove('visible'), 2400);
  }
}
