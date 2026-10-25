// Scoped deterministic regressions; no server, network, dependency writes or emitted files.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const serverRoot = path.resolve(__dirname, '../../ptcg-server');
require(path.join(serverRoot, 'node_modules/ts-node')).register({ project: path.join(serverRoot, 'tsconfig.json') });
const engine = require(path.join(serverRoot, 'src/game'));
const ts = require('typescript');
const root = path.resolve(__dirname, '../src');
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const localRequire = id => {
    if (id === 'ptcg-server') return engine;
    if (id === 'react-i18next') return { useTranslation: () => ({ t: key => key }) };
    if (id.endsWith('.css')) return { default: {} };
    const resolved = path.resolve(path.dirname(file), id);
    if (resolved === path.join(root, 'i18n/i18n')) return { default: { t: key => key } };
    if (id.startsWith('.')) return load(resolved + '.ts');
    return require(id);
  };
  new Function('exports', 'require', 'module', js)(mod.exports, localRequire, mod);
  return mod.exports;
}
const { CardList, PokemonCardList, PokemonCard, EnergyCard, CardType, SuperType,
  Player, State, GamePhase, SpecialCondition, PlayerType, SlotType } = engine;
const { getComputedHp, getCurrentHp } = load(path.join(root, 'card-info/cardInfoUtils.ts'));
const viewed = Object.assign(new PokemonCard(), { id: 10, name: 'Grotle', hp: 100 });
const other = Object.assign(new PokemonCard(), { id: 11, name: 'Torterra', hp: 190 });
const hand = new CardList(); hand.cards = [viewed, other];
assert.equal(getComputedHp(viewed, hand), 100, 'hand must not use the other Pokémon HP');
assert.equal(getCurrentHp(viewed, hand), 100);
assert.equal(getComputedHp(viewed), 100, 'catalog uses printed HP');
const active = new PokemonCardList(); active.cards = [viewed, other]; active.hpBonus = 20; active.damage = 40;
assert.equal(getComputedHp(other, active), 210, 'in-play evolution still uses main card + bonus');
assert.equal(getCurrentHp(other, active), 170, 'in-play damage remains reflected');
console.log('PASS QA-12: hand/catalog HP, evolved in-play bonus and damage');

const { BoardInteractionService } = load(path.join(root, 'table/BoardInteractionService.ts'));
const interaction = new BoardInteractionService();
const target = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
let plays = 0, cancelled = 0;
interaction.startHandPlayTargetSelection([target], picked => { if (picked) plays++; else cancelled++; });
interaction.cancelHandPlayTargetSelection();
assert.equal(plays, 0); assert.equal(cancelled, 1); assert.equal(interaction.isSelectionActive(), false);
assert.equal(interaction.isTargetEligible(target), false);
interaction.toggleTarget(target); assert.equal(plays, 0, 'cancel must disarm callback');
interaction.startHandPlayTargetSelection([target], picked => { if (picked) plays++; });
interaction.toggleTarget(target); assert.equal(plays, 1); assert.equal(interaction.isSelectionActive(), false);
interaction.startHandPlayTargetSelection([target], () => { plays++; });
interaction.clearHandPlayTargetSelectionSilently(); assert.equal(plays, 1, 'unmount/state cleanup must not dispatch');
console.log('PASS QA-03: cancelled choice dispatches no play, callback cleared, valid selection still dispatches');

const { attackBlockReasons } = load(path.join(root, 'table/board2d/attackAvailability.ts'));
const state = new State(); const player = new Player(); player.id = 1;
const opponent = new Player(); opponent.id = 2;
state.players = [player, opponent]; state.phase = GamePhase.PLAYER_TURN; state.activePlayer = 0; state.turn = 3;
const attack = { name: 'Electric Ball', cost: [CardType.LIGHTNING, CardType.COLORLESS], damage: 40, text: '' };
player.active.cards = [viewed];
const lightning = Object.assign(new EnergyCard(), { id: 12, superType: SuperType.ENERGY, provides: [CardType.LIGHTNING] });
player.active.cards.push(lightning);
const before = JSON.stringify(state);
assert.match(attackBlockReasons(state, player, player.active, [attack], true)[attack.name], /还缺 1 个无色/);
assert.equal(JSON.stringify(state), before, 'availability check is read-only');
player.active.cards.push(Object.assign(new EnergyCard(), { id: 13, superType: SuperType.ENERGY, provides: [CardType.WATER] }));
assert.equal(attackBlockReasons(state, player, player.active, [attack], true)[attack.name], undefined);
state.turn = 1; state.rules.attackFirstTurn = false;
assert.match(attackBlockReasons(state, player, player.active, [attack])[attack.name], /首回合/);
assert.equal(attackBlockReasons(state, player, player.active, [{ ...attack, canUseOnFirstTurn: true }])[attack.name], undefined);
state.turn = 3; player.active.specialConditions = [SpecialCondition.ASLEEP];
assert.match(attackBlockReasons(state, player, player.active, [attack])[attack.name], /睡眠/);
player.active.specialConditions = []; player.cannotAttackTurnsRemaining = 1;
assert.match(attackBlockReasons(state, player, player.active, [attack])[attack.name], /卡牌效果/);
player.cannotAttackTurnsRemaining = 0; player.active.cards = [viewed];
assert.equal(attackBlockReasons(state, player, player.active, [attack], false)[attack.name], undefined,
  'formal modified costs must not be mis-disabled from printed metadata');
console.log('PASS QA-04: tutorial missing/sufficient Energy, first-turn exception, status/effect lock, no live-state mutation');

const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { TablePlayerActions } = load(path.join(root, 'table/hud/TablePlayerActions.tsx'));
const actions = { clientId: 1, isPlaying: true, isObserver: false, onLeave: () => {}, onSwitchSides: () => {}, onPassTurn: () => {} };
const replayHtml = renderToStaticMarkup(React.createElement(TablePlayerActions, { ...actions, localGame: { deleted: true, replay: {} } }));
assert.doesNotMatch(replayHtml, /disabled=/, 'replay identified as its original player must still leave');
const deletedLiveHtml = renderToStaticMarkup(React.createElement(TablePlayerActions, { ...actions, localGame: { deleted: true } }));
assert.match(deletedLiveHtml, /disabled=/, 'deleted live game protection stays intact');
console.log('PASS QA-02: participant replay exit enabled; deleted live-game exit still protected');
