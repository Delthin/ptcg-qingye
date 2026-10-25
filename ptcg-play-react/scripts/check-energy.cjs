// Scoped source-level tests. No Vite/browser/server, network, shared dependency writes or emit.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const serverRoot = path.resolve(__dirname, '../../ptcg-server');
require(path.join(serverRoot, 'node_modules/ts-node')).register({ project: path.join(serverRoot, 'tsconfig.json') });
const engine = require(path.join(serverRoot, 'src/game'));
const ts = require('typescript');
const root = path.resolve(__dirname, '../src');
const cache = new Map();
const load = file => {
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  const localRequire = id => {
    if (id === 'ptcg-server') return engine;
    const resolved = path.resolve(path.dirname(file), id);
    if (resolved === path.join(root, 'duo/chineseCatalog')) return {
      cardDisplayName: card => card.name, chineseCard: () => ({ image: '/scans/old-fullName-art.png' }),
    };
    if (resolved === path.join(root, 'utils/publicAssetUrl')) return { publicAssetUrl: p => '/' + p };
    if (resolved === path.join(root, 'env/config')) return { appConfig: { apiUrl: 'https://game.example' } };
    if (id.startsWith('.')) return load(resolved + '.ts');
    return require(id);
  };
  new Function('exports', 'require', 'module', js)(mod.exports, localRequire, mod);
  return mod.exports;
};
const rules = load(path.join(root, 'deck-editor/deckRules.ts'));
const editions = load(path.join(root, 'deck-editor/energyPrintings.ts'));
const { createDeckOwnership } = load(path.join(root, 'deck-editor/deckOwnership.ts'));
const { resolveScanUrl } = load(path.join(root, 'deck-editor/resolveScanUrl.ts'));
const { createBoard3dCardsAdapter } = load(path.join(root, 'table/board3d/createBoard3dCardsAdapter.ts'));
const { GrassEnergy } = require(path.join(serverRoot, 'src/sets/10-scarlet-and-violet/set-scarlet-and-violet-energy/grass-energy'));
const base = new GrassEnergy();
const free = editions.defaultEnergyCard(base);
const collectible = editions.withEnergyPrinting(base, { printingId: 'chs:21795', engineFullName: base.fullName,
  name: '基本草能量', set: '30thC', number: 'GRA', rarity: '无标记', image: '/scans/duo/21795.png' });
assert.equal(collectible.fullName, base.fullName);
assert.equal(Object.getPrototypeOf(collectible), Object.getPrototypeOf(base));
assert.notEqual(engine.cardPrintingKey(collectible), engine.cardPrintingKey(free));
assert.equal(editions.defaultEnergyCard(collectible), collectible);
assert.equal(editions.isFreeBasicEnergy(collectible), false);
assert.equal(editions.isFreeBasicEnergy(free), true);
const legacy = Object.assign(Object.create(Object.getPrototypeOf(base)), base, { fullName: 'Grass Energy LEGACY' });
const legacyFree = editions.defaultEnergyCard(legacy);
assert.equal(legacyFree.fullName, 'Grass Energy LEGACY');
assert.notEqual(engine.cardPrintingKey(legacyFree), engine.cardPrintingKey(free));
const ownership = createDeckOwnership(new Map([['chs:21795', 5]]), 'inventory pending');
assert.equal(ownership.canAdd([{ card: collectible, count: 4 }], collectible).ok, true);
assert.equal(ownership.canAdd([{ card: collectible, count: 5 }], collectible).ok, false);
assert.equal(ownership.canAdd([{ card: free, count: 59 }], free).ok, true);
assert.equal(ownership.canAdd([{ card: free, count: 60 }], free).ok, false);
assert.equal(createDeckOwnership(undefined, 'pending').canAdd([], collectible).ok, false);
assert.equal(createDeckOwnership(undefined, 'pending').canAdd([], free).ok, true);
const ordinaryAlias = editions.withEnergyPrinting(base, { printingId: 'chs:12651', engineFullName: base.fullName, name: '基本草能量', set: 'CSVH1C', number: 'GRA', rarity: '无标记', image: '/scans/duo/12651.png' });
assert.equal(ordinaryAlias.printingId, 'free:grass');
assert.equal(editions.isFreeBasicEnergy(ordinaryAlias), true);
assert.equal(createDeckOwnership(undefined, 'pending').canAdd([{ card: ordinaryAlias, count: 59 }], ordinaryAlias).ok, true);
let slots = [{ card: free, count: 4 }, { card: collectible, count: 3 }, { card: legacyFree, count: 1 }];
const names = rules.flatNamesFromSlots(slots);
const refs = rules.flatPrintingIdsFromSlots(slots);
const restored = rules.slotsFromFlatNames(names, new Map([[base.fullName, free], [legacy.fullName, legacyFree]]), refs,
  new Map([[free.printingId, free], [collectible.printingId, collectible]]));
assert.deepEqual(restored.unknown, []);
assert.equal(restored.slots.length, 3);
assert.deepEqual(restored.slots.map(s => [s.card.fullName, s.card.printingId, s.count]).sort(), slots.map(s => [s.card.fullName, s.card.printingId, s.count]).sort());
slots = rules.removeOneCopy(slots, engine.cardPrintingKey(collectible));
assert.equal(slots.find(s => s.card.printingId === 'chs:21795').count, 2);
assert.equal(slots.find(s => engine.cardPrintingKey(s.card) === engine.cardPrintingKey(free)).count, 4);
const quantities = rules.setSlotCount(slots, collectible, 5);
assert.equal(quantities.ok, true);
assert.equal(quantities.slots.find(s => s.card.printingId === 'chs:21795').count, 5);
const { DoubleTurboEnergy } = require(path.join(serverRoot, 'src/sets/09-sword-and-shield/set-brilliant-stars/double-turbo-energy'));
const special = new DoubleTurboEnergy();
const editionA = editions.withEnergyPrinting(special, { printingId: 'chs:15139', engineFullName: special.fullName, name: '双涡轮能量', set: 'A', number: '1', rarity: '', image: '/scans/a.png' });
const editionB = editions.withEnergyPrinting(special, { printingId: 'chs:15229', engineFullName: special.fullName, name: '双涡轮能量', set: 'B', number: '1', rarity: '', image: '/scans/b.png' });
const specialInventory = createDeckOwnership(new Map([[special.fullName, 4], ['chs:15139', 2], ['chs:15229', 2]]), 'pending');
assert.equal(specialInventory.validate([{ card: editionA, count: 2 }, { card: editionB, count: 2 }]).ok, true);
assert.equal(specialInventory.canAdd([{ card: editionA, count: 2 }], editionA).ok, false);
assert.equal(specialInventory.canAdd([{ card: editionA, count: 2 }], editionB).ok, true);
assert.equal(specialInventory.canAdd([{ card: editionA, count: 2 }, { card: editionB, count: 2 }], special).ok, false);
const maps = { nightly: {}, custom: {}, overrides: {} };
assert.equal(resolveScanUrl(collectible, maps, '', 'https://game.example'), 'https://game.example/scans/duo/21795.png');
assert.equal(resolveScanUrl(free, maps, '', 'https://game.example'), 'https://game.example/scans/duo/12651.png');
global.window = { location: { origin: 'https://game.example' } };
const adapter = createBoard3dCardsAdapter({ maps, scansUrl: '', apiBase: 'https://game.example', sleevesUrl: '',
  showCardInfo: async () => ({}), showCardInfoList: async () => ({}) });
assert.equal(adapter.getScanUrlFor3D(collectible, { artworksMap: { [base.fullName]: { imageUrl: 'https://wrong.example/art.png' } } }),
  'https://game.example/scans/duo/21795.png');
assert.equal(adapter.getScanUrlFor3D(free), 'https://game.example/scans/duo/12651.png');
delete global.window;
console.log('PASS energy source checks: identities/prototypes, edition inventory, 60-card ceiling, slot persistence, quantities, 2D/3D artwork precedence');
