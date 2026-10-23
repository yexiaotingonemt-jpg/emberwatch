import test from 'node:test';
import assert from 'node:assert/strict';
import { GameModel, MAPS, TOWERS, type Enemy, type EnemyType, type Shot, type TowerType } from '../src/model';

// Fixtures isolate a single combat interaction while all simulation steps use update().
type Harness = { queue: unknown[]; spawn(type: EnemyType): void };
const internal = (game: GameModel) => game as unknown as Harness;
function enemy(game: GameModel, type: EnemyType = 'crawler', progress = 0): Enemy {
  internal(game).spawn(type);
  const result = game.enemies.at(-1)!;
  result.progress = progress;
  [result.x, result.y] = game.position(progress);
  return result;
}
function combat(game = new GameModel()): GameModel {
  game.phase = 'wave';
  game.wave = 1;
  internal(game).queue = [];
  return game;
}
function shot(game: GameModel, target: Enemy, type: TowerType, branch: 'a' | 'b' | null = null): void {
  game.shots.push({id:900,x:target.x,y:target.y,tx:target.x,ty:target.y,type,life:2,
    target:target.id,damage:100,towerId:0,branch,level:1} satisfies Shot);
}

test('construction rejects invalid/occupied pads and insufficient gold without charging', () => {
  const game = new GameModel();
  const initial = game.gold;
  assert.equal(game.build(-1, 'arrow'), false);
  assert.equal(game.build(99, 'arrow'), false);
  assert.equal(game.gold, initial);
  assert.equal(game.build(0, 'arrow'), true);
  assert.equal(game.gold, initial - TOWERS.arrow.cost);
  assert.equal(game.build(0, 'cannon'), false);
  game.gold = 0;
  assert.equal(game.build(1, 'storm'), false);
  assert.equal(game.towers.length, 1);
  assert.equal(game.gold, 0);
});

test('upgrades lock the first branch, cap at level 3, and sell refunds only invested gold', () => {
  const game = new GameModel();
  game.gold = 1000;
  game.build(0, 'arrow');
  const tower = game.selectedTower()!;
  assert.equal(game.upgrade('b'), true);
  assert.equal(tower.level, 2);
  assert.equal(tower.branch, 'b');
  assert.equal(game.upgrade('a'), true);
  assert.equal(tower.level, 3);
  assert.equal(tower.branch, 'b');
  const finalGold = game.gold;
  assert.equal(game.upgrade('a'), false);
  assert.equal(game.gold, finalGold);
  assert.equal(tower.invested, 80 + 104 + 168);
  const refund = game.sellValue(tower);
  assert.equal(game.sell(), true);
  assert.equal(game.gold, finalGold + refund);
  assert.equal(game.towers.length, 0);
  assert.equal(game.sell(), false);
  assert.ok(game.gold < 1000, 'buying/upgrading/selling cannot generate money');
});

test('waves require a tower and reject repeated starts', () => {
  const game = new GameModel();
  assert.equal(game.startWave(), false);
  game.build(0, 'arrow');
  assert.equal(game.startWave(), true);
  assert.equal(game.wave, 1);
  assert.equal(game.waveTotal, 10);
  assert.equal(game.startWave(), false);
  assert.equal(game.wave, 1);
});

test('path positions follow bends and terminate at the final point on every map', () => {
  for (const map of MAPS) {
    const game = new GameModel(map.id);
    assert.deepEqual(game.position(0), map.path[0]);
    assert.deepEqual(game.position(100), [map.path[0][0] + 100, map.path[0][1]]);
    assert.deepEqual(game.position(game.pathLength + 100), map.path.at(-1));
    let distance = 0;
    for (let i = 1; i < map.path.length; i++) {
      distance += Math.hypot(map.path[i][0] - map.path[i-1][0], map.path[i][1] - map.path[i-1][1]);
      const point = game.position(distance);
      assert.ok(Math.hypot(point[0] - map.path[i][0], point[1] - map.path[i][1]) < 0.0001);
    }
  }
});

test('pause freezes combat and economy; speed multiplies capped, nonnegative time', () => {
  const game = combat();
  const runner = enemy(game, 'runner');
  game.paused = true;
  game.targeting = true;
  game.update(1);
  assert.equal(runner.progress, 0);
  assert.equal(game.time, 0);
  assert.equal(game.build(0, 'arrow'), false);
  assert.equal(game.meteor(runner.x, runner.y), false);
  game.paused = false;
  game.speed = 3;
  game.update(1);
  assert.ok(Math.abs(runner.progress - 92 * 0.3) < 0.0001);
  const progress = runner.progress;
  game.update(-2);
  assert.equal(runner.progress, progress);
});

test('shield armor reduces physical damage; magic and armor-piercing arrows bypass it', () => {
  const remaining: number[] = [];
  for (const [type, branch] of [['arrow', null], ['frost', null], ['arrow', 'b']] as const) {
    const game = combat();
    const shield = enemy(game, 'shield');
    shot(game, shield, type, branch);
    game.update(0);
    remaining.push(shield.hp);
  }
  assert.deepEqual(remaining, [108, 50, 50]);
});

test('frost control and storm chaining affect multiple appropriate targets', () => {
  const frost = combat();
  const target = enemy(frost, 'brute');
  shot(frost, target, 'frost', 'a');
  frost.update(0);
  assert.ok(target.slow >= 4);
  assert.ok(target.stun > 0);
  const storm = combat();
  storm.gold = 1000;
  storm.build(0, 'storm');
  const tower = storm.selectedTower()!;
  const enemies = Array.from({length:4}, (_,i) => enemy(storm, 'brute', 160 + i * 20));
  tower.cooldown = 0;
  storm.update(0);
  assert.equal(enemies.filter(e => e.hp < e.maxHp).length, 3);
});

test('meteor requires targeting and an active wave, damages only its radius, and enforces cooldown', () => {
  const game = combat();
  const near = enemy(game, 'brute', 120);
  const far = enemy(game, 'brute', 900);
  assert.equal(game.meteor(near.x, near.y), false);
  game.targeting = true;
  assert.equal(game.meteor(near.x, near.y), true);
  assert.ok(near.hp < near.maxHp);
  assert.equal(far.hp, far.maxHp);
  assert.equal(game.targeting, false);
  assert.equal(game.abilityCooldown, 40);
  game.targeting = true;
  assert.equal(game.meteor(far.x, far.y), false);
  game.update(0.1);
  assert.equal(game.abilityCooldown, 39.9);
});

test('meteor rejects invalid and off-map coordinates without consuming targeting or cooldown', () => {
  const game = combat();
  game.targeting = true;
  for (const [x,y] of [[-1,200],[100,-1],[1101,200],[100,741],[NaN,200],[100,Infinity]]) {
    assert.equal(game.meteor(x,y), false);
    assert.equal(game.targeting, true);
    assert.equal(game.abilityCooldown, 0);
  }
});

test('perk decisions freeze simulation and purchase actions, then apply exactly one choice', () => {
  const game = combat();
  const target = enemy(game);
  game.perkChoices = ['fortune', 'fury'];
  const gold = game.gold;
  game.update(0.1);
  assert.equal(target.progress, 0);
  assert.equal(game.build(0, 'arrow'), false);
  assert.equal(game.choosePerk('winter'), false);
  assert.equal(game.choosePerk('fortune'), true);
  assert.equal(game.gold, gold + 180);
  assert.equal(game.choosePerk('fury'), false);
  assert.deepEqual(game.perks, ['fortune']);
  game.update(0.1);
  assert.ok(target.progress > 0);
});

test('renewal caps health and shortens meteor cooldown; winter increases meteor damage', () => {
  const game = combat();
  game.hp = 18;
  game.abilityCooldown = 39;
  game.perkChoices = ['renewal'];
  game.choosePerk('renewal');
  assert.equal(game.hp, 20);
  assert.equal(game.abilityCooldown, 26);
  game.perks.push('winter');
  game.abilityCooldown = 0;
  const boss = enemy(game, 'boss');
  boss.x = 100;
  const before = boss.hp;
  game.targeting = true;
  game.meteor(boss.x, boss.y);
  assert.equal(game.abilityCooldown, 26);
  assert.ok(Math.abs(before - boss.hp - 228 * 1.35) < 0.0001);
});

test('a leaking boss ends the run once, with no victory or record overwrite', () => {
  const game = combat(new GameModel(0, {'0':3}));
  game.wave = 15;
  game.hp = 3;
  enemy(game, 'boss', game.pathLength - 1);
  game.update(0.1);
  assert.equal(game.phase, 'defeat');
  assert.equal(game.hp, 0);
  assert.equal(game.stars, 0);
  assert.equal(game.best['0'], 3);
  game.update(0.1);
  assert.equal(game.events.filter(e => e.type === 'defeat').length, 1);
});

test('final-wave victory awards stars once and preserves each map best across restart', () => {
  for (const [hp, stars] of [[20,3],[18,3],[17,2],[10,2],[9,1],[1,1]]) {
    const game = combat(new GameModel(1, {'0':3,'1':2}));
    game.hp = hp;
    game.wave = 15;
    game.update(0.1);
    assert.equal(game.phase, 'victory');
    assert.equal(game.stars, stars);
    assert.equal(game.best['1'], Math.max(2, stars));
    const score = game.score;
    game.update(0.1);
    assert.equal(game.score, score);
    assert.equal(game.events.filter(e => e.type === 'victory').length, 1);
    game.restart(2);
    assert.equal(game.phase, 'build');
    assert.equal(game.wave, 0);
    assert.equal(game.hp, 20);
    assert.equal(game.map.id, 2);
    assert.equal(game.best['0'], 3);
    assert.equal(game.best['1'], Math.max(2, stars));
  }
});

const PAD_ORDERS = [
  [4,7,2,10,8,13,0,12,14,6,5,9,15,3,1,11],
  [2,5,8,10,7,11,9,0,4,6,13,14,15,1,3,12],
  [4,7,8,2,10,13,0,6,9,12,3,5,14,1,11,15],
];

function playCampaign(map: number): {phase:string;hp:number;kills:number;wave:number;meteors:number;towers:number;gold:number} {
  const game = new GameModel(map);
  game.speed = 3;
  let ticks = 0, meteors = 0;
  const order = PAD_ORDERS[map];
  while (game.phase !== 'victory' && game.phase !== 'defeat' && ticks++ < 70000) {
    if (game.perkChoices.length) game.choosePerk(game.perkChoices.includes('fury') ? 'fury' : 'haste');
    // Establish overlapping crossfire, then invest in upgrades and armor penetration.
    const needInitial = game.towers.length < 3;
    if (needInitial) {
      const pad = order.find(p => !game.towers.some(t => t.pad === p));
      if (pad !== undefined) game.build(pad, 'arrow');
    } else {
      const tower = game.towers.find(t => t.level < 3);
      if (tower) {
        game.selectedPad = tower.pad;
        game.upgrade(order.indexOf(tower.pad) % 3 === 2 ? 'b' : 'a');
      } else {
        const pad = order.find(p => !game.towers.some(t => t.pad === p));
        if (pad !== undefined) game.build(pad, 'arrow');
      }
    }
    if (game.phase === 'build') game.startWave();
    if (game.abilityCooldown <= 0 && game.enemies.length) {
      const urgent = game.enemies.find(e => e.type === 'boss') ?? game.enemies.reduce((a,b) => a.progress > b.progress ? a : b);
      const clustered = game.enemies.filter(e => Math.hypot(e.x-urgent.x,e.y-urgent.y) < 115).length;
      if (urgent.type === 'boss' || urgent.progress > game.pathLength * .75 || clustered >= 6) {
        game.targeting = true;
        if (game.meteor(urgent.x, urgent.y)) meteors++;
      }
    }
    game.update(0.1);
    game.events = [];
  }
  return {phase:game.phase,hp:game.hp,kills:game.kills,wave:game.wave,meteors,towers:game.towers.length,gold:game.gold};
}

test('all three full campaigns are winnable with a reproducible crossfire strategy', () => {
  for (let map = 0; map < MAPS.length; map++) {
    const result = playCampaign(map);
    console.log(`Campaign ${MAPS[map].name}: ${JSON.stringify(result)}`);
    assert.equal(result.phase, 'victory', `${MAPS[map].name} must be winnable with earned gold`);
    assert.equal(result.wave, 15);
    assert.ok(result.hp > 0);
    assert.ok(result.kills > 300);
  }
});

test('a neglected starting defense cannot coast through the full campaign', () => {
  const game = new GameModel();
  game.speed = 3;
  [4,7,2].forEach(pad => game.build(pad, 'arrow'));
  let ticks = 0;
  while (game.phase !== 'victory' && game.phase !== 'defeat' && ticks++ < 70000) {
    if (game.perkChoices.length) game.choosePerk(game.perkChoices[0]);
    if (game.phase === 'build') game.startWave();
    game.update(0.1);
    game.events = [];
  }
  assert.equal(game.phase, 'defeat');
  assert.ok(game.wave > 1, 'the opening defense should still be viable');
});
