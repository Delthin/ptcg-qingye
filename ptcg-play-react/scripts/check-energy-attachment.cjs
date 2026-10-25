// Scoped source-prompt / React-model regressions. No browser, network, shared writes or emit.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const server = path.join(root, 'ptcg-server');
require(path.join(server, 'node_modules/ts-node')).register({ project: path.join(server, 'tsconfig.json') });
const engine = require(path.join(server, 'src/game'));
const ts = require(path.join(root, 'ptcg-play-react/node_modules/typescript'));
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} };
  cache.set(file, mod);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('exports', 'require', 'module', js)(mod.exports, id => id === 'ptcg-server' ? engine :
    id.startsWith('.') ? load(path.resolve(path.dirname(file), id) + '.ts') : require(id), mod);
  return mod.exports;
}
const { computeAttachEnergyInvalid, buildAttachEnergyFilterMap, isEnergyIndexEligible } =
  load(path.join(root, 'ptcg-play-react/src/table/prompts/attachEnergyPromptModel.ts'));
const { setupGame, padDeck } = require(path.join(server, 'src/sets/tests/test-helpers'));
const { useAttack } = require(path.join(server, 'src/sets/tests/card-test-helpers'));
const game = setupGame({ turn: 2,
  player1: { active: { card: 'Joltik SCR', energy: ['Grass Energy SVE'] }, bench: [{ card: 'Ralts SIT' }],
    deck: ['Grass Energy SVE', 'Grass Energy SVE', 'Lightning Energy SVE', 'Lightning Energy SVE', ...padDeck(10)] },
  player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
});
const to = { player: engine.PlayerType.BOTTOM_PLAYER, slot: engine.SlotType.BENCH, index: 0 };
game.overridePrompt(engine.AttachEnergyPromptType, prompt => {
  const assignments = prompt.cardList.cards.slice(0, 4).map((card, originalIndex) => ({ to, card, originalIndex }));
  assert.equal(computeAttachEnergyInvalid(assignments.slice(0, 2), { ...prompt.options, differentTypes: true }), true);
  assert.equal(computeAttachEnergyInvalid(assignments, prompt.options), false);
  assert.equal(computeAttachEnergyInvalid(assignments.slice(0, 2), prompt.options), false);
  assert.equal(computeAttachEnergyInvalid([], prompt.options), false);
  const thirdGrass = { ...assignments[0], originalIndex: 99, card: Object.assign(
    Object.create(Object.getPrototypeOf(assignments[0].card)), assignments[0].card, { id: 99999 }) };
  assert.equal(computeAttachEnergyInvalid([assignments[0], assignments[1], thirdGrass], prompt.options), true);
  const blockedSecond = buildAttachEnergyFilterMap(prompt.cardList.cards, prompt.filter, [1]);
  assert.equal(isEnergyIndexEligible(blockedSecond, 0), true);
  assert.equal(isEnergyIndexEligible(blockedSecond, 1), false);
  assert.equal(isEnergyIndexEligible(blockedSecond, 2), true);
  const blockedFirst = buildAttachEnergyFilterMap(prompt.cardList.cards, prompt.filter, [0]);
  assert.equal(isEnergyIndexEligible(blockedFirst, 0), false);
  assert.equal(isEnergyIndexEligible(blockedFirst, 1), true);
  assert.equal(isEnergyIndexEligible(blockedFirst, 2), true);
  return [];
});
useAttack(game.store, game.state, 0, 'Jolting Charge');
console.log('PASS 11 energy attachment model assertions: repeated types, four/zero choices, type cap and independent duplicate-copy eligibility');
