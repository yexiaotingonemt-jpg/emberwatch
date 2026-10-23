import { GameModel, TOWERS, MAPS, PERKS, type TowerType } from './model';

export interface UIActions {
  build: (type: TowerType) => void;
  startWave: () => void;
  selectPad: (pad: number | null) => void;
  upgrade: (branch: 'a' | 'b') => void;
  sell: () => void;
  speed: () => void;
  pause: () => void;
  ability: () => void;
  restart: () => void;
  chooseMap: (id: number) => void;
  choosePerk: (id: string) => void;
  toggleSound: () => void;
}

const towerTypes: TowerType[] = ['arrow', 'cannon', 'frost', 'storm'];
const svg = (body: string, cls = '', viewBox = '0 0 40 40') => `<svg class="${cls}" viewBox="${viewBox}" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const icons = {
  arrow: svg('<path d="M12 31h16l-2-12H14z" fill="currentColor" opacity=".25"/><path d="M10 32h20M14 29V18l6-5 6 5v11M14 23h12M20 13V7M10 7q10 11 20 0M10 7q10 3 20 0M20 4v14M17 7l3-3 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  cannon: svg('<path d="M11 31h18l-3-13H14z" fill="currentColor" opacity=".23"/><path d="M9 32h22M13 29l2-12h10l2 12M16 17l-3-8 5-3 7 8M15 10l5-3M14 23h12M20 27v-4M28 5l-2 3M33 10l-4 1M30 17l3 1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  frost: svg('<path d="M11 32h18l-3-12H14z" fill="currentColor" opacity=".2"/><path d="M10 33h20M14 29l2-9h8l2 9M20 3v18M12 7l16 10M12 17 28 7M17 5l3 3 3-3M17 19l3-3 3 3M12 10l4 1-1-4M25 17l-1-4 4-1M12 14l4-1-1 4M25 7l-1 4 4 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'),
  storm: svg('<path d="M11 32h18l-3-12H14z" fill="currentColor" opacity=".2"/><path d="M10 33h20M14 29l2-10h8l2 10M23 3l-9 12h7l-3 10 10-14h-7l2-8zM10 9l-3 5M31 21l3-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'),
  heart: svg('<path d="M20 32S5 23 5 13C5 4 16 3 20 10 24 3 35 4 35 13c0 10-15 19-15 19z" fill="currentColor"/>'),
  coin: svg('<path d="m20 4 13 8v16l-13 8-13-8V12z" stroke="currentColor" stroke-width="2"/><path d="m20 10 8 5v10l-8 5-8-5V15z" fill="currentColor" opacity=".3"/><path d="M17 17h7m-8 6h7m-3-9v12" stroke="currentColor" stroke-width="2"/>'),
  flag: svg('<path d="M11 35V5m1 1h21l-5 8 5 7H12" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>'),
  meteor: svg('<path d="m19 22 15-17M23 27l13-14M13 17 25 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M23 25a10 10 0 1 1-9-9l9 9z" fill="currentColor" opacity=".25"/><path d="M23 25a10 10 0 1 1-9-9l9 9z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="27" r="3" stroke="currentColor" stroke-width="1.7"/>'),
  map: svg('<path d="m5 10 10-4 10 4 10-4v25l-10 4-10-4-10 4V10zM15 6v25m10-21v25" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'),
  help: svg('<circle cx="20" cy="20" r="14" stroke="currentColor" stroke-width="2"/><path d="M15 15c0-7 12-7 12 0 0 5-7 4-7 10M20 30v-1" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'),
  sound: svg('<path d="M6 15h7l9-8v26l-9-8H6V15zM27 13q9 7 0 14M31 7q15 13 0 26" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
  muted: svg('<path d="M6 15h7l9-8v26l-9-8H6V15zM28 15l9 10m0-10-9 10" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
  pause: svg('<path d="M12 8v24M28 8v24" stroke="currentColor" stroke-width="6"/>'),
  play: svg('<path d="m13 8 19 12-19 12V8z" fill="currentColor"/>'),
  speed: svg('<path d="m5 10 14 10L5 30V10zm16 0 14 10-14 10V10z" fill="currentColor"/>'),
  crown: svg('<path d="m5 12 8 7 7-13 7 13 8-7-4 20H9L5 12z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 27h20" stroke="currentColor" stroke-width="1.8"/>'),
};

const escapeHtml = (value: unknown) => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));

export class GameUI {
  private model: GameModel;
  private actions: UIActions;
  private root: HTMLElement;
  private panelSignature = '';
  private modal = '';
  private modalSignature = '';
  private modalPaused = false;
  private soundOn = true;
  private lastPaused: boolean | undefined;
  private toastTimer: ReturnType<typeof setTimeout> | undefined;
  private nodes: Record<string, HTMLElement> = {};

  constructor(model: GameModel, actions: UIActions) {
    this.model = model;
    this.actions = actions;
    try { this.soundOn = localStorage.getItem('emberwatch-sound') !== 'off'; } catch { /* Storage can be blocked in private mode. */ }
    this.root = document.querySelector<HTMLElement>('#app')!;
    this.root.innerHTML = `
      <div class="game-shell">
        <header class="masthead">
          <a class="brand" href="#" aria-label="余烬守望首页"><span class="brand-seal">${svg('<path d="m20 2 5 11 10 5-10 5-5 15-5-15-10-5 10-5z" stroke="currentColor" stroke-width="1.4"/><path d="M20 11c-1 6-8 9-4 15 4 5 13-1 8-8-1 4-5 3-4-7z" fill="currentColor"/>')}</span><span><span class="brand-en">EMBERWATCH</span><span class="brand-cn">余 烬 守 望 <i>·</i> FOREST DEFENSE</span></span></a>
          <div class="resource-bar" aria-live="off">
            <div class="resource hp">${icons.heart}<span><small>灯塔生命</small><strong id="hp-value">20 <em>/ 20</em></strong></span></div>
            <div class="resource gold">${icons.coin}<span><small>建设金币</small><strong id="gold-value">0</strong></span></div>
            <div class="resource wave">${icons.flag}<span><small>当前波次</small><strong id="wave-value">0 <em>/ 15</em></strong></span></div>
          </div>
          <nav class="utility-nav" aria-label="游戏菜单"><button class="icon-button" data-action="maps" aria-label="选择战场" title="选择战场">${icons.map}</button><button class="icon-button" data-action="sound" aria-label="切换音效" title="切换音效" id="sound-button">${icons.sound}</button><button class="icon-button" data-action="help" aria-label="玩法说明" title="玩法说明">${icons.help}</button></nav>
        </header>
        <main class="game-layout">
          <section class="battle-section" aria-label="塔防战场">
            <div class="battle-heading"><div><span class="eyebrow" id="map-eyebrow">CHAPTER 01 / THE ANCIENT WOODS</span><h1 id="map-title">暮光林地</h1></div><button class="map-switch" data-action="maps">切换战场 <span>↗</span></button></div>
            <div class="battle-frame"><div id="battlefield" aria-label="点击空地建造防御塔，抵御敌人，保护灯塔"></div><div class="field-tag"><span class="live-dot"></span><span id="field-status">守望准备中</span></div><div class="kill-chip"><span>已击退</span><b id="kills-value">0</b></div><div class="field-hint" id="field-hint">选择右侧防御塔，再点击场内建造点</div><div class="pause-shade" id="pause-shade" hidden><span>Ⅱ</span><h2>战场已暂停</h2><button class="button brass" data-action="pause">继续守望</button></div><div class="corner c-tl"></div><div class="corner c-tr"></div><div class="corner c-bl"></div><div class="corner c-br"></div></div>
            <div class="wave-track"><span class="wave-label" id="wave-label">备战阶段</span><div class="track"><i id="wave-progress"></i></div><span class="wave-count" id="wave-count">准备迎敌</span></div>
            <div class="battle-controls"><button class="button brass start-wave" id="start-button" data-action="start"><span class="start-icon">${icons.play}</span><span><strong id="start-label">开始第一波</strong><small id="start-detail">准备就绪，放敌入场</small></span><kbd>SPACE</kbd></button><button class="button meteor-button" id="ability-button" data-action="ability"><span class="ability-icon">${icons.meteor}</span><span><strong>天火陨落</strong><small id="ability-detail">点击施放 · F</small></span><span class="ready-pip" id="ability-status">就绪</span></button><div class="tempo-controls"><button class="icon-button" id="pause-button" data-action="pause" title="暂停 / 继续 · P" aria-label="暂停游戏">${icons.pause}</button><button class="speed-button" id="speed-button" data-action="speed" title="切换游戏速度">${icons.speed}<strong id="speed-label">1×</strong></button></div></div>
            <div class="map-caption"><span id="map-subtitle">守住森林最后的光。</span><span>本地保存战绩 <i>·</i> <span id="best-value">尚未通关</span></span></div>
          </section>
          <aside class="command-panel" aria-label="防御工事">
            <div class="panel-heading"><span class="eyebrow">YOUR LAST LINE OF DEFENSE</span><h2>构筑防线<span>01 — 04</span></h2><p>四种守望之力，守住每一个转角。</p></div>
            <div class="arsenal">${towerTypes.map((type, index) => `<button class="tower-card ${type}" data-action="build" data-type="${type}" aria-label="建造${escapeHtml(TOWERS[type].name)}"><span class="tower-art">${icons[type]}</span><span class="tower-copy"><span class="tower-name">${escapeHtml(TOWERS[type].name)}<kbd>${index+1}</kbd></span><span class="tower-role">${escapeHtml(TOWERS[type].label)}</span><span class="tower-description">${escapeHtml(TOWERS[type].description)}</span></span><span class="tower-price">${icons.coin}<b>${TOWERS[type].cost}</b></span></button>`).join('')}</div>
            <section id="selected-panel" class="selection-panel" aria-label="已选防御塔"></section>
            <section class="scout-report"><div class="scout-title"><span class="scout-mark">◇</span><h3>前线情报</h3><span id="preview-wave">NEXT WAVE</span></div><p id="wave-preview"></p></section>
            <div class="side-footer"><span class="tiny-tree">♧</span><p>只要余烬未熄<br><strong>森林便仍有希望</strong></p><span class="footer-line"></span></div>
          </aside>
        </main>
        <footer class="game-footer"><span>THE WOODS REMEMBER EVERY GUARDIAN.</span><span><kbd>1</kbd> – <kbd>4</kbd> 建造 <i>·</i> <kbd>ESC</kbd> 取消 <i>·</i> <button data-action="help">查看守望手册</button></span></footer>
      </div><div id="toast" class="toast" role="status" aria-live="polite"></div><div id="modal-host"></div>`;
    this.root.querySelectorAll<HTMLElement>('[id]').forEach(node => this.nodes[node.id] = node);
    this.nodes['sound-button'].innerHTML = this.soundOn ? icons.sound : icons.muted;
    this.root.addEventListener('click', event => this.handleClick(event));
    this.root.querySelector('.brand')?.addEventListener('click', event => event.preventDefault());
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.modal && !['result', 'perk'].includes(this.modal)) { this.closeModal(); event.preventDefault(); }
      else if (this.modal) {
        event.stopImmediatePropagation();
        if (event.key === 'Tab') {
          const buttons = Array.from(this.nodes['modal-host'].querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
          const first = buttons[0], last = buttons.at(-1);
          if (event.shiftKey && document.activeElement === first) { last?.focus(); event.preventDefault(); }
          else if (!event.shiftKey && document.activeElement === last) { first?.focus(); event.preventDefault(); }
        }
      }
    }, true);
    this.render();
  }

  private text(id: string, content: string) {
    const node = this.nodes[id];
    if (node && node.textContent !== content) node.textContent = content;
  }

  render() {
    const m = this.model;
    const ended = m.phase === 'victory' || m.phase === 'defeat';
    this.text('gold-value', String(Math.floor(m.gold)));
    const hp = `${m.hp} <em>/ ${m.maxHp}</em>`;
    if (this.nodes['hp-value'].innerHTML !== hp) this.nodes['hp-value'].innerHTML = hp;
    const wave = `${m.wave.toString().padStart(2, '0')} <em>/ ${m.maxWaves}</em>`;
    if (this.nodes['wave-value'].innerHTML !== wave) this.nodes['wave-value'].innerHTML = wave;
    this.nodes['hp-value'].classList.toggle('danger', m.hp <= m.maxHp * .3);
    this.text('kills-value', String(m.kills));
    this.text('map-title', m.map.name);
    this.text('map-subtitle', m.map.subtitle);
    this.text('map-eyebrow', `CHAPTER ${String(m.map.id + 1).padStart(2,'0')} / ${['THE ANCIENT WOODS', 'A RIVER OF WHISPERS', 'THE LAST SANCTUARY'][m.map.id] ?? 'THE ANCIENT WOODS'}`);
    const best = m.best[String(m.map.id)] || 0;
    this.text('best-value', best ? `${'★'.repeat(best)} 最佳战绩` : '尚未通关');
    this.text('field-status', m.paused ? '时间静止' : m.phase === 'wave' ? '敌潮正在逼近' : ended ? (m.phase === 'victory' ? '森林重获安宁' : '灯塔光芒熄灭') : '构筑防线 · 备战中');
    this.text('field-hint', m.targeting ? '选择一处敌人密集区域，让天火降临 · ESC 取消' : m.buildType ? `点击发光建造点，部署${TOWERS[m.buildType].name} · ESC 取消` : m.selectedPad !== null ? (m.selectedTower() ? '选择进阶路线，强化你的防御塔' : '选择右侧防御塔，在此处构筑防线') : m.phase === 'wave' ? '战斗中也可建造与升级 · 守住灯塔' : '选择右侧防御塔，再点击场内建造点');
    this.nodes['field-hint'].classList.toggle('active', Boolean(m.targeting || m.buildType));
    this.nodes['pause-shade'].hidden = !m.paused || Boolean(this.modal) || ended;
    this.text('wave-label', m.phase === 'wave' ? `第 ${m.wave} 波` : ended ? '战斗结束' : '备战阶段');
    this.text('wave-count', m.phase === 'wave' ? `剩余 ${m.waveRemaining} / ${m.waveTotal}` : ended ? `${m.kills} 已击退` : `下一波 ${Math.min(m.wave + 1, m.maxWaves)} / ${m.maxWaves}`);
    this.nodes['wave-progress'].style.width = `${m.phase === 'wave' && m.waveTotal ? Math.max(0, Math.min(100, (1 - m.waveRemaining/m.waveTotal) * 100)) : ended ? 100 : 0}%`;
    this.text('start-label', m.phase === 'wave' ? `第 ${m.wave} 波 · 战斗中` : ended ? '守望已结束' : m.wave === 0 ? '开始第一波' : `迎战第 ${m.wave + 1} 波`);
    this.text('start-detail', m.phase === 'wave' ? '守住阵地，击退全部敌人' : ended ? '前往下一场守望' : '部署防御后，点击迎敌');
    (this.nodes['start-button'] as HTMLButtonElement).disabled = m.phase !== 'build' || !!m.perkChoices.length;
    const cooldown = Math.ceil(m.abilityCooldown);
    this.text('ability-detail', m.targeting ? '选择落点 · ESC 取消' : cooldown > 0 ? `冷却中 · ${cooldown}s` : '范围轰击 · F');
    this.text('ability-status', cooldown > 0 ? `${cooldown}s` : m.targeting ? '瞄准' : '就绪');
    (this.nodes['ability-button'] as HTMLButtonElement).disabled = cooldown > 0 || ended;
    this.nodes['ability-button'].classList.toggle('targeting', m.targeting);
    this.text('speed-label', `${m.speed}×`);
    if (this.lastPaused !== m.paused) {
      this.nodes['pause-button'].innerHTML = m.paused ? icons.play : icons.pause;
      this.nodes['pause-button'].setAttribute('aria-label', m.paused ? '继续游戏' : '暂停游戏');
      this.lastPaused = m.paused;
    }
    for (const type of towerTypes) {
      const button = this.root.querySelector<HTMLButtonElement>(`[data-type="${type}"]`)!;
      button.classList.toggle('selected', m.buildType === type);
      button.classList.toggle('unaffordable', m.gold < TOWERS[type].cost);
      button.setAttribute('aria-pressed', String(m.buildType === type));
      button.disabled = ended;
    }
    this.text('wave-preview', m.nextWavePreview());
    this.text('preview-wave', m.wave < m.maxWaves ? `WAVE ${String(m.wave + 1).padStart(2, '0')}` : 'FINAL WAVE');
    this.renderSelection();
    if (ended && this.modal !== 'maps' && this.modal !== 'help') this.showResult();
    else if (m.perkChoices.length) this.showPerks();
    else if (this.modal === 'result' || this.modal === 'perk') this.closeModal();
  }

  private renderSelection() {
    const m = this.model;
    const tower = m.selectedTower();
    const signature = JSON.stringify([m.selectedPad, tower && [tower.id, tower.level, tower.branch, tower.kills], m.buildType, Math.floor(m.gold), m.perks, m.phase]);
    if (signature === this.panelSignature) return;
    this.panelSignature = signature;
    const panel = this.nodes['selected-panel'];
    if (!tower) {
      const type = m.buildType;
      panel.innerHTML = type ? `<div class="selection-title"><span class="eyebrow">READY TO DEPLOY</span><button data-action="cancel" class="text-button">取消选择 ×</button></div><h3 class="selection-name">${escapeHtml(TOWERS[type].name)}<span>${TOWERS[type].cost} 金币</span></h3><p>${escapeHtml(TOWERS[type].description)}</p><div class="deployment-prompt"><span></span>点击战场中的发光建造点</div>` : `<div class="selection-empty">${svg('<path d="M8 9V5h7m10 0h7v7m0 13v7h-7m-10 0H8v-7M13 20h14m-7-7v14" stroke="currentColor" stroke-width="1.3"/>')}<div><h3>${m.selectedPad !== null ? '空置的守望塔基' : '每一座塔，都至关重要'}</h3><p>${m.selectedPad !== null ? '选择上方塔型，在此部署防御' : '选择塔基建造，点击已建塔升级'}</p></div></div>`;
      return;
    }
    const info = TOWERS[tower.type];
    const stats = m.stats(tower);
    const maxed = tower.level >= 3;
    const cost = m.upgradeCost(tower);
    panel.innerHTML = `<div class="selection-title"><span class="eyebrow">TOWER INSPECTOR</span><button data-action="cancel" class="text-button" aria-label="取消选择">×</button></div><h3 class="selection-name">${escapeHtml(info.name)} <span>LV. ${tower.level}</span></h3><div class="tower-stats"><span>伤害<strong>${Math.round(stats.damage)}</strong></span><span>射程<strong>${Math.round(stats.range)}</strong></span><span>攻速<strong>${(1/stats.interval).toFixed(1)}<small>/秒</small></strong></span></div><div class="upgrade-label">${maxed ? '已达到最高等级' : tower.branch ? `${escapeHtml(info.branches[tower.branch].name)} · 继续强化` : '选择进阶路线'}</div>${maxed ? `<div class="max-level">${icons.crown}<span>精锐守望者</span><small>累计击退 ${tower.kills}</small></div>` : (['a','b'] as const).filter(branch => !tower.branch || tower.branch === branch).map(branch => `<button class="upgrade-button" data-action="upgrade" data-branch="${branch}" ${m.gold < cost ? 'disabled' : ''}><span><strong>${escapeHtml(info.branches[branch].name)}</strong><small>${escapeHtml(info.branches[branch].description)}</small></span><b>${cost}<small>金币</small></b></button>`).join('')}<button class="sell-button" data-action="sell">拆除防御塔 <span>返还 ${m.sellValue(tower)} 金币</span></button>`;
  }

  private handleClick(event: Event) {
    const button = (event.target as Element).closest<HTMLElement>('[data-action]');
    if (!button || (button as HTMLButtonElement).disabled) return;
    const action = button.dataset.action;
    if (action === 'build') this.actions.build(button.dataset.type as TowerType);
    else if (action === 'start') this.actions.startWave();
    else if (action === 'ability') this.actions.ability();
    else if (action === 'pause') this.actions.pause();
    else if (action === 'speed') this.actions.speed();
    else if (action === 'upgrade') this.actions.upgrade(button.dataset.branch as 'a'|'b');
    else if (action === 'sell') this.actions.sell();
    else if (action === 'cancel') { this.actions.selectPad(null); this.model.buildType = null; this.model.targeting = false; }
    else if (action === 'help') this.showHelp();
    else if (action === 'maps') this.showMaps();
    else if (action === 'close') this.closeModal();
    else if (action === 'sound') {
      this.soundOn = !this.soundOn;
      this.actions.toggleSound();
      this.nodes['sound-button'].innerHTML = this.soundOn ? icons.sound : icons.muted;
    } else if (action === 'restart') { this.closeModal(); this.actions.restart(); }
    else if (action === 'choose-map') { this.closeModal(); this.actions.chooseMap(Number(button.dataset.map)); }
    else if (action === 'perk') { this.actions.choosePerk(button.dataset.perk!); this.closeModal(); }
    this.render();
  }

  private openModal(type: string, content: string, locked = false) {
    if (!this.modal && !this.model.paused && this.model.phase === 'wave') { this.actions.pause(); this.modalPaused = true; }
    this.modal = type;
    this.nodes['modal-host'].innerHTML = `<div class="modal-backdrop"><section class="modal ${type}-modal" role="dialog" aria-modal="true" aria-label="${type === 'help' ? '守望手册' : type === 'maps' ? '选择战场' : type === 'perk' ? '选择祝福' : '守望战报'}">${locked ? '' : '<button class="modal-close" data-action="close" aria-label="关闭对话框">×</button>'}${content}</section></div>`;
    if (!locked) this.nodes['modal-host'].querySelector('.modal-backdrop')!.addEventListener('click', event => { if (event.target === event.currentTarget) this.closeModal(); });
    (this.nodes['modal-host'].querySelector('button') as HTMLButtonElement | null)?.focus({preventScroll:true});
    this.nodes['pause-shade'].hidden = true;
  }

  private closeModal() {
    this.nodes['modal-host'].innerHTML = '';
    this.modal = '';
    this.modalSignature = '';
    if (this.modalPaused && this.model.paused) this.actions.pause();
    this.modalPaused = false;
  }

  private showHelp() {
    this.openModal('help', `<span class="eyebrow">THE GUARDIAN'S HANDBOOK</span><h2>守望手册</h2><p class="modal-intro">敌潮将至。让每一枚金币，成为森林的盾。</p><div class="help-steps"><article><b>01</b><div><h3>部署你的第一道防线</h3><p>选择塔型，再点击战场上的石质塔基建造。弓箭塔擅长单体输出，火炮塔轰击成群敌人，寒霜塔减速，雷电塔攻击多个目标。</p></div></article><article><b>02</b><div><h3>应对不断变化的敌潮</h3><p>每张地图共有 15 波进攻。侦察兵、重甲兵与首领会陆续出现。战斗中也能建造、升级；点击防御塔，选择两条独特进阶路线。</p></div></article><article><b>03</b><div><h3>用天火扭转战局</h3><p>点击「天火陨落」，再选择战场落点，造成范围伤害。技能随时间恢复；第 5、10 波后可选择森林祝福，强化整条防线。</p></div></article></div><div class="key-guide"><span><kbd>1</kbd>–<kbd>4</kbd> 选择塔型</span><span><kbd>SPACE</kbd> 开始波次</span><span><kbd>F</kbd> 天火陨落</span><span><kbd>P</kbd> 暂停</span><span><kbd>ESC</kbd> 取消</span></div><button class="button brass modal-primary" data-action="close">我准备好了</button>`);
  }

  private showMaps() {
    this.openModal('maps', `<span class="eyebrow">CHOOSE YOUR BATTLEGROUND</span><h2>踏入森林深处</h2><p class="modal-intro">三处古老的疆界，同一个必须守护的誓言。</p><div class="map-options">${MAPS.map((map, index) => `<button class="map-option map-${index}" data-action="choose-map" data-map="${map.id}"><span class="map-landscape"><span class="mini-moon"></span><span class="mini-mountain"></span><span class="mini-path"></span><span class="mini-tree t1"></span><span class="mini-tree t2"></span><span class="mini-tree t3"></span><b>0${index+1}</b></span><span class="map-option-copy"><span class="eyebrow">${['THE ANCIENT WOODS','A RIVER OF WHISPERS','THE LAST SANCTUARY'][index]}</span><strong>${escapeHtml(map.name)}</strong><small>${escapeHtml(map.description)}</small><span class="map-stars">${this.model.best[String(map.id)] ? '★'.repeat(this.model.best[String(map.id)]) : '☆ ☆ ☆'}<em>${map.id === this.model.map.id ? '当前战场' : '进入战场 →'}</em></span></span></button>`).join('')}</div><p class="modal-note">选择战场将开启一场新的守望 · 最佳星级自动保存在此设备</p>`);
  }

  private showPerks() {
    const signature = this.model.perkChoices.join(',');
    if (this.modal === 'perk' && this.modalSignature === signature) return;
    this.openModal('perk', `<span class="blessing-emblem">${icons.crown}</span><span class="eyebrow">A GIFT FROM THE ANCIENT WOODS</span><h2>森林回应了你的守望</h2><p class="modal-intro">选择一项祝福。此力量将伴随本场战斗。</p><div class="perk-options">${this.model.perkChoices.map((id,index) => `<button class="perk-option" data-action="perk" data-perk="${escapeHtml(id)}"><span class="perk-rune">${[icons.arrow,icons.storm,icons.frost,icons.cannon][index%4]}</span><strong>${escapeHtml(PERKS[id].name)}</strong><small>${escapeHtml(PERKS[id].description)}</small><span>接受祝福 →</span></button>`).join('')}</div>`, true);
    this.modalSignature = signature;
  }

  private showResult() {
    const m = this.model;
    const signature = `${m.phase}-${m.map.id}-${m.score}-${m.stars}`;
    if (this.modal === 'result' && this.modalSignature === signature) return;
    const victory = m.phase === 'victory';
    this.openModal('result', `<div class="result-emblem ${victory ? '' : 'fallen'}">${victory ? icons.crown : icons.heart}</div><span class="eyebrow">${victory ? 'THE LIGHT ENDURES' : 'EVEN THE LONGEST NIGHT WILL END'}</span><h2>${victory ? '余烬长明' : '守望尚未结束'}</h2><p class="modal-intro">${victory ? '敌潮退去，森林记住了你的名字。' : '灯塔的光暂时熄灭，新的防线等待你来构筑。'}</p><div class="result-stars">${victory ? Array.from({length:3},(_,i) => `<span class="${i < m.stars ? 'earned' : ''}">★</span>`).join('') : '<span class="fallen-leaf">◇</span>'}</div><div class="result-stats"><span>坚守波次<strong>${m.wave}<small> / ${m.maxWaves}</small></strong></span><span>击退敌人<strong>${m.kills}</strong></span><span>守望得分<strong>${m.score.toLocaleString()}</strong></span></div><div class="result-actions"><button class="button brass" data-action="restart">${victory ? '再次守望' : '重新挑战'}</button><button class="button secondary" data-action="maps">探索其他战场 →</button></div>`, true);
    this.modalSignature = signature;
  }

  toast(text: string) {
    clearTimeout(this.toastTimer);
    this.nodes.toast.textContent = text;
    this.nodes.toast.classList.add('visible');
    this.toastTimer = setTimeout(() => this.nodes.toast.classList.remove('visible'), 2600);
  }
}
