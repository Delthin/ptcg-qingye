import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { Card } from '../../game/store/card/card';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { EnergyCard } from '../../game/store/card/energy-card';
import { CardType, Stage, SuperType } from '../../game/store/card/card-types';
import { AttackAction } from '../../game/store/actions/game-actions';
import { PlayCardAction, CardTarget, PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { Prompt } from '../../game/store/prompts/prompt';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { ShuffleDeckPrompt } from '../../game/store/prompts/shuffle-prompt';
import { ConfirmPrompt } from '../../game/store/prompts/confirm-prompt';
import { MoveEnergyPrompt } from '../../game/store/prompts/move-energy-prompt';
import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { StateSerializer } from '../../game/serializer/state-serializer';
import { CheckProvidedEnergyEffect } from '../../game/store/effects/check-effects';
import { EnergyEffect } from '../../game/store/effects/play-card-effects';
import { GameError } from '../../game/game-error';
import { GameMessage } from '../../game/game-message';
import { StateUtils } from '../../game/store/state-utils';
import { UnitEnergyGRW } from '../08-sun-and-moon/set-ultra-prism/unit-energy-grw';
import { UnitEnergyLPM } from '../08-sun-and-moon/set-ultra-prism/unit-energy-lpm';
import { UnitEnergyFDY } from '../08-sun-and-moon/set-forbidden-light/unit-energy-fdy';
import { RichEnergy } from '../10-scarlet-and-violet/set-surging-sparks/rich-energy';
import { MedicalEnergy } from '../10-scarlet-and-violet/set-paradox-rift/medical-energy';
import { AlolanGolem } from '../08-sun-and-moon/set-team-up/alolan-golem';
import { Electrode } from '../08-sun-and-moon/set-team-up/electrode';
import { Bellossom } from '../07-x-and-y/set-ancient-origins/bellossom';
import { TempleofSinnoh } from '../09-sword-and-shield/set-astral-radiance/temple-of-sinnoh';
import { Laprasex } from '../10-scarlet-and-violet/set-stellar-crown/lapras-ex';

class Target extends PokemonCard {
  public name = 'Compatibility Target'; public fullName = 'Compatibility Target TEST'; public set = 'TEST';
  public hp = 2000; public weakness = []; public resistance = [];
}
class Basic extends EnergyCard {
  public name = ''; public fullName = ''; public set = 'TEST';
  constructor(type: CardType) {
    super(); this.provides = [type]; this.name = 'Basic ' + type; this.fullName = this.name + ' TEST'; this.set = 'TEST';
  }
}
let cards: Card[];
function id<T extends Card>(card: T): T { card.id = cards.length; cards.push(card); return card; }
function board(card: PokemonCard = new Target(), side = 0) {
  cards = [];
  const state = new State(); state.phase = GamePhase.PLAYER_TURN; state.turn = 5; state.activePlayer = side;
  state.players = [new Player(), new Player()];
  state.players.forEach((p, index) => {
    p.id = index === 0 ? 17 : 29; p.active.cards = [id(new Target())];
    p.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    p.bench.slice(0, 3).forEach(b => b.cards = [id(new Target())]);
    p.deck.cards = Array.from({ length: 8 }, () => id(new Target()));
    p.prizes = Array.from({ length: 6 }, () => { const list = new CardList(); list.cards = [id(new Target())]; return list; });
  });
  const player = state.players[side], opponent = state.players[1 - side];
  player.active.cards = [id(card)];
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  return { store, state, player, opponent, card };
}
type Board = ReturnType<typeof board>;
const own = (slot = SlotType.ACTIVE, index = 0): CardTarget => ({ player: PlayerType.BOTTOM_PLAYER, slot, index });
const other = (slot = SlotType.ACTIVE, index = 0): CardTarget => ({ player: PlayerType.TOP_PLAYER, slot, index });
function pending(g: Board): Prompt<any> {
  const prompt = g.state.prompts.find(p => p.result === undefined);
  if (!prompt) throw new Error('No pending prompt');
  return prompt;
}
function answer(g: Board, raw: any): void {
  const prompt = pending(g);
  const decoded = prompt.decode(JSON.parse(JSON.stringify(raw)), g.state);
  expect(prompt.validate(decoded, g.state)).toBe(true);
  g.store.dispatch(new ResolvePromptAction(prompt.id, decoded), prompt.playerId);
}
function finish(g: Board): void {
  for (let i = 0; g.store.hasPrompts() && i < 20; i++) {
    const prompt = pending(g);
    if (prompt instanceof WaitPrompt) answer(g, true);
    else if (prompt instanceof ShuffleDeckPrompt) {
      answer(g, g.state.players.find(p => p.id === prompt.playerId)!.deck.cards.map((_, index) => index));
    } else throw new Error('Unexpected prompt ' + prompt.type);
  }
  expect(g.store.hasPrompts()).toBe(false);
}
function attack(g: Board, index = 0): void {
  g.store.dispatch(new AttackAction(g.player.id, g.card.attacks[index].name));
}
function wire(g: Board): State {
  g.state.cardNames = cards.map(card => card.fullName);
  const known = StateSerializer.knownCards;
  StateSerializer.setKnownCards(cards);
  try { const serializer = new StateSerializer(); return serializer.deserialize(serializer.serialize(g.state)); }
  finally { StateSerializer.setKnownCards(known); }
}
function energyMap(g: Board, source = g.player.active) {
  const check = new CheckProvidedEnergyEffect(g.player, source); g.store.reduceEffect(g.state, check); return check.energyMap;
}
const units = [
  { ctor: UnitEnergyGRW, types: [CardType.GRASS, CardType.FIRE, CardType.WATER] },
  { ctor: UnitEnergyLPM, types: [CardType.LIGHTNING, CardType.PSYCHIC, CardType.METAL] },
  { ctor: UnitEnergyFDY, types: [CardType.FIGHTING, CardType.DARK, CardType.FAIRY] },
];

describe('Happy6 energy compatibility — real Store actions', () => {
  it('Lapras pays Water with one GRW and deals exactly 40', () => {
    const g = board(new Laprasex()); g.player.active.cards.push(id(new UnitEnergyGRW()));
    attack(g); finish(g); expect(g.opponent.active.damage).toBe(40);
  });

  it('Temple prevents Lapras paying Water with GRW, before attack damage', () => {
    const g = board(new Laprasex()), energy = id(new UnitEnergyGRW()); g.player.active.cards.push(energy);
    g.player.stadium.cards = [id(new TempleofSinnoh())];
    expect(() => attack(g)).toThrow(new GameError(GameMessage.NOT_ENOUGH_ENERGY));
    expect(g.opponent.active.damage).toBe(0); expect(g.player.active.cards).toContain(energy);
    expect(g.store.hasPrompts()).toBe(false);
  });

  it('Larimar Rain attaches Rich and Medical from its top-20 list without hand-only bonuses (28-card deck)', () => {
    const g = board(new Laprasex());
    g.player.active.cards.push(id(new Basic(CardType.WATER)), id(new Basic(CardType.PSYCHIC)), id(new Basic(CardType.METAL)));
    const rich = id(new RichEnergy()), medical = id(new MedicalEnergy());
    g.player.deck.cards = [rich, medical, ...Array.from({ length: 26 }, () => id(new Target()))];
    g.player.bench[0].damage = 80; g.player.bench[0].cannotAttachEnergyFromHandNextTurn = true;
    g.player.energyPlayedTurn = g.state.turn;
    attack(g, 1); const prompt = pending(g) as AttachEnergyPrompt;
    expect(prompt instanceof AttachEnergyPrompt).toBe(true); expect(prompt.cardList.cards.length).toBe(20);
    expect(g.player.deck.cards.length).toBe(8); // Four erroneous Rich draws would be observable.
    answer(g, [rich, medical].map(card => ({ to: own(SlotType.BENCH), index: prompt.cardList.cards.indexOf(card) })));
    expect(g.player.hand.cards.length).toBe(0); expect(g.player.bench[0].damage).toBe(80);
    [rich, medical].forEach(card => {
      expect(g.player.bench[0].cards).toContain(card); expect(g.player.bench[0].energies.cards).toContain(card);
    });
    expect(g.player.energyPlayedTurn).toBe(5); finish(g);
    expect(g.player.deck.cards.length).toBe(26); expect(g.player.hand.cards.length).toBe(0);
  });

  for (const ctor of [RichEnergy, MedicalEnergy]) for (const temple of [false, true]) {
    it(ctor.name + ' still attaches from hand through PlayCardAction; Temple=' + temple, () => {
      const g = board(), energy = id(new ctor()); g.player.hand.cards = [energy]; g.player.active.damage = 80;
      if (temple) g.player.stadium.cards = [id(new TempleofSinnoh())];
      g.store.dispatch(new PlayCardAction(g.player.id, 0, own())); finish(g);
      expect(g.player.active.cards).toContain(energy); expect(g.player.active.energies.cards).toContain(energy);
      expect(g.player.energyPlayedTurn).toBe(5);
      expect(g.player.hand.cards.length).toBe(!temple && ctor === RichEnergy ? 4 : 0);
      expect(g.player.active.damage).toBe(!temple && ctor === MedicalEnergy ? 50 : 80);
    });
  }

  const movers = [
    { name: 'Alolan Golem', ctor: AlolanGolem, type: CardType.LIGHTNING, unit: UnitEnergyLPM, to: own() },
    { name: 'Electrode', ctor: Electrode, type: CardType.LIGHTNING, unit: UnitEnergyLPM, to: own(SlotType.BENCH, 1) },
    { name: 'Bellossom', ctor: Bellossom, type: CardType.GRASS, unit: UnitEnergyGRW, to: own(SlotType.BENCH, 1) },
  ];
  function startMove(g: Board, name: string): MoveEnergyPrompt {
    if (name === 'Electrode') {
      const electrode = id(new Electrode()), voltorb = id(new Target()); voltorb.name = 'Voltorb'; voltorb.stage = Stage.BASIC;
      g.player.bench[2].cards = [voltorb]; g.player.bench[2].pokemonPlayedTurn = 1;
      g.player.hand.cards = [electrode];
      g.store.dispatch(new PlayCardAction(g.player.id, 0, own(SlotType.BENCH, 2)));
      expect(g.player.bench[2].getPokemonCard()).toBe(electrode);
      expect(pending(g) instanceof ConfirmPrompt).toBe(true); answer(g, true);
    } else {
      if (name === 'Bellossom') g.player.active.cards.push(id(new Basic(CardType.GRASS)), id(new Basic(CardType.COLORLESS)));
      attack(g, name === 'Bellossom' ? 1 : 0);
    }
    const prompt = pending(g); expect(prompt instanceof MoveEnergyPrompt).toBe(true); return prompt as MoveEnergyPrompt;
  }

  // No cardType array filter: EnergyCard has no cardType. The same blockedMap
  // must be available to the serialized UI and enforced by wire/direct actions.
  for (const mover of movers) {
    for (const special of [false, true]) for (const side of [0, 1]) {
      it(mover.name + ' accepts ' + (special ? 'one blended Unit' : 'basic required type') + ', side ' + side, () => {
        const g = board(new mover.ctor(), side), energy = id(special ? new mover.unit() : new Basic(mover.type));
        g.player.bench[0].cards.push(energy);
        const prompt = startMove(g, mover.name);
        expect(prompt.filter).toEqual({ superType: SuperType.ENERGY });
        const raw = [{ from: own(SlotType.BENCH), to: mover.to, index: 1 }];
        const client = wire(g), cp = client.prompts.find(p => p.id === prompt.id) as MoveEnergyPrompt;
        expect(cp.validate(cp.decode(raw, client), client)).toBe(true);
        expect(cp.options.blockedMap).toEqual(prompt.options.blockedMap);
        expect(prompt.options.blockedMap.find(entry => entry.source.slot === SlotType.BENCH && entry.source.index === 0)!.blocked).not.toContain(1);
        answer(g, raw); finish(g);
        expect(g.player.bench[0].cards).not.toContain(energy);
        const target = mover.to.slot === SlotType.ACTIVE ? g.player.active : g.player.bench[1];
        expect(target.cards).toContain(energy);
        if (mover.name !== 'Electrode') expect(g.opponent.active.damage).toBe(mover.name === 'Bellossom' ? 60 : 20);
      });
    }

    it(mover.name + ' moves multiple eligible cards and accepts an empty response', () => {
      const g = board(new mover.ctor()), basic = id(new Basic(mover.type)), unit = id(new mover.unit());
      g.player.bench[0].cards.push(basic, unit);
      startMove(g, mover.name);
      answer(g, [1, 2].map(index => ({ from: own(SlotType.BENCH), to: mover.to, index }))); finish(g);
      const target = StateUtils.getTarget(g.state, g.player, mover.to);
      expect(target.cards).toContain(basic); expect(target.cards).toContain(unit);
      expect(g.player.bench[0].cards).not.toContain(basic); expect(g.player.bench[0].cards).not.toContain(unit);
      if (mover.name !== 'Electrode') expect(g.opponent.active.damage).toBe(mover.name === 'Bellossom' ? 60 : 40);
      const empty = board(new mover.ctor()), untouched = id(new Basic(mover.type)); empty.player.bench[0].cards.push(untouched);
      startMove(empty, mover.name); answer(empty, []); finish(empty);
      expect(empty.player.bench[0].cards).toContain(untouched);
      if (mover.name === 'Alolan Golem') expect(empty.opponent.active.damage).toBe(0);
    });

    it(mover.name + ' excludes final Temple-muted Unit and wrong type; rejects forged batches atomically', () => {
      const g = board(new mover.ctor()), legal = id(new Basic(mover.type)), muted = id(new mover.unit()), wrong = id(new Basic(CardType.FIRE));
      g.player.active.cards.push(legal); g.player.bench[0].cards.push(muted, wrong);
      // Golem's legal source is the Bench only.
      if (mover.name === 'Alolan Golem') g.player.active.moveCardTo(legal, g.player.bench[1]);
      g.player.stadium.cards = [id(new TempleofSinnoh())];
      const prompt = startMove(g, mover.name);
      const map = prompt.options.blockedMap.find(entry => entry.source.slot === SlotType.BENCH && entry.source.index === 0)!;
      expect(map.blocked).toContain(1); expect(map.blocked).toContain(2);
      const to = mover.to;
      [1, 2, 0].forEach(index => expect(() => prompt.decode([{ from: own(SlotType.BENCH), to, index }], g.state)).toThrow());
      const legalFrom = mover.name === 'Alolan Golem' ? own(SlotType.BENCH, 1) : own();
      expect(() => g.store.dispatch(new ResolvePromptAction(prompt.id, [
        { from: legalFrom, to, card: legal }, { from: own(SlotType.BENCH), to, card: muted },
      ]), g.player.id)).toThrow();
      expect(StateUtils.getTarget(g.state, g.player, legalFrom).cards).toContain(legal);
      expect(g.player.bench[0].cards).toContain(muted); expect(g.player.bench[0].cards).toContain(wrong);
      expect(g.opponent.active.damage).toBe(0);
      // Store removes an invalid direct-action prompt; there is no response to resume.
      expect(g.state.prompts.some(p => p.id === prompt.id)).toBe(false);
    });

    it(mover.name + ' retains own-source/destination restrictions and cancellation', () => {
      const g = board(new mover.ctor()), energy = id(new Basic(mover.type)); g.player.bench[0].cards.push(energy);
      const enemy = id(new Basic(mover.type)); g.opponent.bench[0].cards.push(enemy);
      const prompt = startMove(g, mover.name);
      expect(prompt.options.allowCancel).toBe(true); expect(prompt.options.min).toBe(0); expect(prompt.options.max).toBeUndefined();
      const bad = [
        [{ from: other(SlotType.BENCH), to: mover.to, index: 1 }],
        [{ from: own(SlotType.BENCH), to: other(), index: 1 }],
        [{ from: own(SlotType.BENCH), to: own(SlotType.BENCH), index: 1 }],
      ];
      if (mover.name === 'Alolan Golem') {
        bad.push([{ from: own(SlotType.BENCH), to: own(SlotType.BENCH, 1), index: 1 }]);
        const activeEnergy = id(new Basic(mover.type)); g.player.active.cards.push(activeEnergy);
        bad.push([{ from: own(), to: own(SlotType.BENCH), index: g.player.active.cards.indexOf(activeEnergy) }]);
      }
      bad.forEach(raw => expect(() => prompt.decode(raw, g.state)).toThrow());
      answer(g, null); finish(g);
      expect(g.player.bench[0].cards).toContain(energy); expect(g.opponent.bench[0].cards).toContain(enemy);
    });
  }
});

// Supplementary direct contracts, not substitutes for the action cases above.
describe('Happy6 Unit energy compatibility — direct provided-energy contracts', () => {
  for (const unit of units) {
    it(unit.ctor.name + ' offers each printed alternative but only one unit', () => {
      const g = board(), energy = id(new unit.ctor()); g.player.active.cards.push(energy);
      const entries = energyMap(g); expect(entries.length).toBe(1);
      unit.types.forEach(type => expect(StateUtils.checkEnoughEnergy(entries, [type])).toBe(true));
      expect(StateUtils.checkEnoughEnergy(entries, [CardType.COLORLESS, CardType.COLORLESS])).toBe(false);
      expect(StateUtils.checkEnoughEnergy(entries, [unit.types[0], unit.types[1]])).toBe(false);
      expect(StateUtils.checkEnoughEnergy(entries, [CardType.COLORLESS])).toBe(true);
      expect(StateUtils.checkEnoughEnergy(entries, [CardType.DRAGON])).toBe(false);
      expect(entries[0].providesOptions!.provides).toEqual(entries[0].provides);
    });

    it(unit.ctor.name + ' still contributes when all three types and another Unit are already present', () => {
      const g = board(); g.player.active.cards.push(...unit.types.map(type => id(new Basic(type))));
      const first = id(new unit.ctor()), second = id(new unit.ctor()); g.player.active.cards.push(first, second);
      const entries = energyMap(g); expect(entries.length).toBe(5);
      expect(entries.filter(entry => entry.card === first || entry.card === second).length).toBe(2);
      expect(StateUtils.checkEnoughEnergy(entries, [...unit.types, unit.types[2], unit.types[2]])).toBe(true);
      expect(StateUtils.checkEnoughEnergy(entries, Array(6).fill(CardType.COLORLESS))).toBe(false);
    });

    it(unit.ctor.name + ' respects Temple final null, final type rewrites, and recovers after Temple leaves', () => {
      const g = board(), energy = id(new unit.ctor()); g.player.active.cards.push(energy);
      g.player.stadium.cards = [id(new TempleofSinnoh())]; const muted = energyMap(g);
      expect(muted[0].providesOptions).toBe(null); expect(StateUtils.getEnergyUnits(muted[0])).toEqual([[CardType.COLORLESS]]);
      unit.types.forEach(type => expect(StateUtils.checkEnoughEnergy(muted, [type])).toBe(false));
      g.player.stadium.cards = []; const normal = energyMap(g);
      unit.types.forEach(type => expect(StateUtils.checkEnoughEnergy(normal, [type])).toBe(true));
      normal[0].provides = [CardType.DRAGON];
      unit.types.forEach(type => expect(StateUtils.checkEnoughEnergy(normal, [type])).toBe(false));
      expect(StateUtils.checkEnoughEnergy(normal, [CardType.DRAGON])).toBe(true);
      const explicitlyCleared = energyMap(g); explicitlyCleared[0].providesOptions = null;
      expect(StateUtils.checkEnoughEnergy(explicitlyCleared, [unit.types[2]])).toBe(false);
    });

    it(unit.ctor.name + ' does not revive alternatives when its EnergyEffect is blocked', () => {
      for (const throws of [true, false]) {
        const g = board(); g.player.active.cards.push(id(new unit.ctor()));
        g.opponent.active.getPokemonCard()!.reduceEffect = (_store, state, effect) => {
          if (effect instanceof EnergyEffect) {
            if (throws) throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
            effect.preventDefault = true;
          }
          return state;
        };
        const blocked = energyMap(g);
        unit.types.forEach(type => expect(StateUtils.checkEnoughEnergy(blocked, [type])).toBe(false));
        expect(StateUtils.checkEnoughEnergy(blocked, [CardType.COLORLESS])).toBe(true);
      }
    });
  }
});
