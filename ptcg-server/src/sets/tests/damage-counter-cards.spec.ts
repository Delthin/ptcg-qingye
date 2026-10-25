import { PlayerType, SlotType, CardTarget } from '../../game/store/actions/play-card-action';
import { AttackEffect, PowerEffect } from '../../game/store/effects/game-effects';
import { MoveDamagePrompt } from '../../game/store/prompts/move-damage-prompt';
import { PutDamagePrompt } from '../../game/store/prompts/put-damage-prompt';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Store } from '../../game/store/store';
import { playTrainerCard } from './card-test-helpers';
import { setupGame, padDeck } from './test-helpers';
import { DamagePump } from '../09-sword-and-shield/set-lost-origin/damage-pump';
import { Grimsley } from '../08-sun-and-moon/set-unified-minds/grimsley';

const ownActive: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const ownBench: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
const oppActive: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const oppBench: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 0 };
function board() {
  const game = setupGame({ turn: 3,
    player1: { active: { card: 'Ralts SIT', damage: 30 }, bench: [{ card: 'Ralts SIT', damage: 20 }, { card: 'Ralts SIT' }], deck: padDeck(10) },
    player2: { active: { card: 'Ralts SIT', damage: 50 }, bench: [{ card: 'Ralts SIT', damage: 30 }], deck: padDeck(10) }
  });
  const store = new Store({ onStateChange() {} }, false);
  store.state = game.state;
  return { ...game, store };
}
function lastPrompt(game: ReturnType<typeof board>) {
  return game.state.prompts[game.state.prompts.length - 1];
}
function answer(game: ReturnType<typeof board>, result: any) {
  const prompt = lastPrompt(game);
  expect(prompt.validate(result, game.state)).toBe(true);
  game.store.dispatch(new ResolvePromptAction(prompt.id, result));
}
function power(path: string, name: string) {
  const game = board();
  const card: PokemonCard = new (require('../' + path)[name])();
  game.player1.bench[1].cards = [card];
  card.reduceEffect(game.store, game.state, new PowerEffect(game.player1, card.powers[0], card));
  return { ...game, card };
}

describe('damage-counter cards: trainer actions', () => {
  it('Damage Pump moves two counters from one source to multiple destinations and is discarded', () => {
    const game = board(); const card = new DamagePump(); game.player1.hand.cards = [card];
    playTrainerCard(game.store, game.state, 0, card.fullName);
    const prompt = lastPrompt(game) as MoveDamagePrompt;
    expect(prompt.options.singleSourceTarget).toBe(true);
    expect(prompt.validate([{ from: ownActive, to: ownBench }, { from: ownBench, to: ownActive }], game.state)).toBe(false);
    answer(game, [{ from: ownActive, to: ownBench }, { from: ownActive, to: { ...ownBench, index: 1 } }]);
    expect(game.player1.active.damage).toBe(10);
    expect(game.player1.bench[0].damage).toBe(30);
    expect(game.player1.bench[1].damage).toBe(10);
    expect(game.player1.discard.cards).toContain(card);
    expect(game.player1.supporterTurn).toBe(0);
  });
  it('Grimsley uses opponent targets, allows KO, and consumes one Supporter', () => {
    const game = board(); const card = new Grimsley(); game.player1.hand.cards = [card];
    playTrainerCard(game.store, game.state, 0, card.fullName);
    const prompt = lastPrompt(game) as MoveDamagePrompt;
    expect(prompt.validate([{ from: oppBench, to: oppActive }, { from: oppBench, to: oppActive }], game.state)).toBe(true);
    answer(game, [{ from: oppActive, to: oppBench }]);
    expect(game.player2.active.damage).toBe(40);
    expect(game.player2.bench[0].damage).toBe(40);
    expect(game.player1.supporterTurn).toBe(1);
    expect(game.player1.discard.cards).toContain(card);
  });
});

describe('damage-counter cards: moving power contracts', () => {
  for (const [path, name, side] of [
    ['06-black-and-white/set-black-and-white/reuniclus', 'Reuniclus', PlayerType.BOTTOM_PLAYER],
    ['06-black-and-white/set-boundaries-crossed/dusknoir', 'Dusknoir', PlayerType.TOP_PLAYER],
    ['set-base-set/alakazam', 'Alakazam', PlayerType.BOTTOM_PLAYER],
    ['set-fossil/slowbro', 'Slowbro', PlayerType.BOTTOM_PLAYER],
    ['10-scarlet-and-violet/set-scarlet-and-violet/slowbro', 'Slowbro', PlayerType.BOTTOM_PLAYER]
  ] as const) {
    it(`${path} offers exactly one counter in the correct perspective`, () => {
      const game = power(path, name); const prompt = lastPrompt(game) as MoveDamagePrompt;
      expect(prompt instanceof MoveDamagePrompt).toBe(true);
      expect(prompt.options.min).toBe(1); expect(prompt.options.max).toBe(1);
      expect(prompt.maxAllowedDamage.every(x => x.target.player === side)).toBe(true);
    });
  }
  it('SVI Slowbro can receive damage but other destinations are blocked', () => {
    const game = power('10-scarlet-and-violet/set-scarlet-and-violet/slowbro', 'Slowbro');
    const self = { ...ownBench, index: 1 };
    expect(lastPrompt(game).validate([{ from: ownActive, to: self }], game.state)).toBe(true);
    expect(lastPrompt(game).validate([{ from: ownActive, to: ownBench }], game.state)).toBe(false);
    answer(game, [{ from: ownActive, to: self }]);
    expect(game.player1.active.damage).toBe(20); expect(game.player1.bench[1].damage).toBe(10);
  });
  it('Radiant Alakazam moves from one opponent source, including a KO destination', () => {
    const game = power('09-sword-and-shield/set-silver-tempest/radiant-alakazam', 'RadiantAlakazam');
    const prompt = lastPrompt(game) as MoveDamagePrompt;
    expect(prompt.options.singleSourceTarget).toBe(true);
    expect(prompt.validate([{ from: oppBench, to: oppActive }, { from: oppBench, to: oppActive }], game.state)).toBe(true);
  });
});

describe('damage-counter cards: self-placement attacks', () => {
  for (const [path, name, index, amount] of [
    ['10-scarlet-and-violet/set-scarlet-and-violet-promos/annihilape-ex', 'Annihilapeex', 0, 120],
    ['08-sun-and-moon/set-unified-minds/froslass', 'Froslass', 0, 70],
    ['09-sword-and-shield/set-chilling-reign/banette', 'Banette', 0, 70],
    ['10-scarlet-and-violet/set-twilight-masquerade/walking-wake', 'WalkingWake', 1, 90]
  ] as const) {
    for (const placed of [0, amount]) {
      it(`${name} places ${placed / 10} counters without requiring an opponent bench`, () => {
        const game = board(); const card: PokemonCard = new (require('../' + path)[name])();
        game.player1.active.cards = [card]; game.player1.active.damage = 0;
        game.player2.bench[0].cards = [];
        const effect = new AttackEffect(game.player1, game.player2, card.attacks[index]);
        card.reduceEffect(game.store, game.state, effect);
        const prompt = lastPrompt(game) as PutDamagePrompt;
        expect(prompt instanceof PutDamagePrompt).toBe(true);
        expect(prompt.damage).toBe(amount);
        answer(game, placed === 0 ? [] : [{ target: ownActive, damage: placed }]);
        expect(game.player1.active.damage).toBe(placed);
        expect(effect.damage).toBe(placed * 2);
      });
    }
  }
});
