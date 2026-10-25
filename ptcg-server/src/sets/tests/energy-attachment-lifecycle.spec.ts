import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { Store } from '../../game/store/store';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { ChooseCardsPrompt } from '../../game/store/prompts/choose-cards-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { ShuffleDeckPrompt } from '../../game/store/prompts/shuffle-prompt';
import { AttachEnergyEffect, TrainerEffect } from '../../game/store/effects/play-card-effects';
import { PlayerType, SlotType, PlayCardAction } from '../../game/store/actions/play-card-action';
import { CardManager } from '../../game/cards/card-manager';
import { EnergyCard } from '../../game/store/card/energy-card';
import { GameMessage } from '../../game/game-message';
import { padDeck, setupGame, getCardByName } from './test-helpers';
import { useAbility, playTrainerCard } from './card-test-helpers';
import { Clawitzer } from '../07-x-and-y/set-steam-siege/clawitzer';
import { MSceptileEx } from '../07-x-and-y/set-ancient-origins/m-sceptile-ex';
import { NsResolve } from '../08-sun-and-moon/set-cosmic-eclipse/ns-resolve';
import { RedAndBlue } from '../08-sun-and-moon/set-cosmic-eclipse/red-and-blue';
import { Primarina } from '../08-sun-and-moon/set-lost-thunder/primarina';
import { OldCemetery } from '../09-sword-and-shield/set-chilling-reign/old-cemetery';
import { Latias } from '../09-sword-and-shield/set-fusion-strike/latias';

const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const bench = { ...active, slot: SlotType.BENCH };
function fixture(source = 'hand') {
  const game = setupGame({ turn: 4,
    player1: { active: { card: 'Arceus V BRS' }, bench: [{ card: 'Primarina LOT' }],
      hand: source === 'hand' ? ['Water Energy SVE', 'Water Energy SVE'] : ['Water Energy SVE'],
      discard: source === 'discard' ? ['Water Energy SVE'] : [],
      deck: ['Water Energy SVE', ...padDeck(10)] },
    player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
  });
  game.player1.stadium.cards = [getCardByName('Old Cemetery CRE 147')];
  return game;
}
describe('Energy attachment source, manual origin and successful-move boundary', () => {
  beforeAll(() => {
    const manager = CardManager.getInstance();
    for (const card of [new Clawitzer(), new MSceptileEx(), new NsResolve(), new RedAndBlue(), new Primarina(), new OldCemetery(), new Latias()]) {
      if (!manager.isCardDefined(card.fullName)) manager.defineCard(card);
    }
  });
  it('the Store rejects an illegal complete assignment before invoking any movement callback', () => {
    const game = fixture();
    game.player1.hand.cards[1] = getCardByName('Double Turbo Energy BRS');
    const store = new Store({ onStateChange() {} });
    store.state = game.state;
    const before = [...game.player1.hand.cards];
    let called = false;
    const prompt = new AttachEnergyPrompt(game.player1.id, GameMessage.ATTACH_ENERGY_CARDS,
      game.player1.hand, PlayerType.BOTTOM_PLAYER, [SlotType.ACTIVE], { name: 'Water Energy' }, { max: 2 });
    store.prompt(game.state, prompt, assignments => {
      called = true;
      for (const assignment of assignments || []) game.player1.hand.moveCardTo(assignment.card, game.player1.active);
    });
    expect(() => store.dispatch(new ResolvePromptAction(prompt.id,
      before.map(card => ({ card, to: active }))))).toThrow();
    expect(called).toBe(false);
    expect(game.player1.hand.cards).toEqual(before);
    expect(game.player1.active.energies.cards.length).toBe(0);
  });
  it('known blockers reject a normal PlayCardAction before consuming the once-per-turn attachment', () => {
    const game = fixture();
    const before = [...game.player1.hand.cards];
    const attachmentTurn = game.player1.energyPlayedTurn;
    game.player1.active.cannotAttachEnergyFromHandNextTurn = true;
    expect(() => game.store.dispatch(new PlayCardAction(game.player1.id, 0, active))).toThrow();
    expect(game.player1.energyPlayedTurn).toBe(attachmentTurn);
    expect(game.player1.hand.cards).toEqual(before);
    expect(game.player1.active.damage).toBe(0);
    expect(game.state.prompts.filter(p => p.result === undefined).length).toBe(0);
  });
  ['hand', 'deck', 'discard'].forEach(source => {
    it(`Old Cemetery checks ${source}, while a default effect attachment never triggers Harmonics`, () => {
      const game = fixture(source);
      const from = source === 'deck' ? game.player1.deck : source === 'discard' ? game.player1.discard : game.player1.hand;
      const energy = from.cards[0] as EnergyCard;
      const before = [...game.player1.hand.cards];
      game.store.reduceEffect(game.state, new AttachEnergyEffect(game.player1, energy, game.player1.active, from));
      expect(game.player1.active.damage).toBe(source === 'hand' ? 20 : 0);
      expect(game.state.prompts.filter(p => p.result === undefined).length).toBe(0);
      expect(game.player1.active.cards).toContain(energy);
      if (source !== 'hand') expect(game.player1.hand.cards).toEqual(before);
    });
  });
  ['hand-lock', 'all-energy-lock', 'special-energy-lock', 'prevented', 'missing-source', 'silent-noop'].forEach(reason => {
    it(`${reason} cannot create damage counters, Harmonics prompts or a phantom energy attachment`, () => {
      const game = fixture();
      const energy = game.player1.hand.cards[0] as EnergyCard;
      const effect = new AttachEnergyEffect(game.player1, energy, game.player1.active);
      effect.isManual = true;
      if (reason === 'hand-lock') game.player1.active.cannotAttachEnergyFromHandNextTurn = true;
      if (reason === 'all-energy-lock') game.player1.cannotPlayEnergyCards = true;
      if (reason === 'special-energy-lock') {
        effect.energyCard = getCardByName('Double Turbo Energy BRS') as EnergyCard;
        game.player1.hand.cards[0] = effect.energyCard;
        game.player1.cannotPlaySpecialEnergyCards = true;
      }
      if (reason === 'prevented') game.player1.active.getPokemonCard()!.reduceEffect = (_store, state, candidate) => {
        if (candidate instanceof AttachEnergyEffect) candidate.preventDefault = true;
        return state;
      };
      if (reason === 'missing-source') effect.energyCard = getCardByName('Water Energy SVE') as EnergyCard;
      if (reason === 'silent-noop') game.player1.hand.moveCardTo = () => {};
      const before = [...game.player1.hand.cards];
      if (reason === 'prevented') game.store.reduceEffect(game.state, effect);
      else expect(() => game.store.reduceEffect(game.state, effect)).toThrow();
      expect(game.player1.hand.cards).toEqual(before);
      expect(game.player1.active.energies.cards.length).toBe(0);
      expect(game.player1.active.damage).toBe(0);
      expect(game.state.prompts.filter(p => p.result === undefined).length).toBe(0);
    });
  });
  [false, true].forEach(unlimited => {
    it(`ordinary PlayCardAction is explicitly manual, including unlimited=${unlimited}, and Harmonics stays on the same recipient`, () => {
      const game = fixture();
      game.state.rules.unlimitedEnergyAttachments = unlimited;
      if (unlimited) game.player1.hand.cards.push(getCardByName('Water Energy SVE'), getCardByName('Water Energy SVE'));
      const times = unlimited ? 2 : 1;
      let extras = 0;
      for (let i = 0; i < times; i++) {
        game.overridePrompt('Attach energy', p => {
          const prompt = p as AttachEnergyPrompt;
          expect(prompt.cardList.cards.length).toBeGreaterThanOrEqual(1);
          expect(() => prompt.decode([{ to: bench, index: 0 }], game.state)).toThrow();
          extras++;
          return [{ to: active, index: 0 }];
        });
        game.store.dispatch(new PlayCardAction(game.player1.id, 0, active));
      }
      expect(extras).toBe(times);
      expect(game.player1.active.energies.cards.length).toBe(times * 2);
      expect(game.player1.active.damage).toBe(times * 40);
      expect(game.player1.bench[0].energies.cards.length).toBe(0);
    });
  });
  [false, true].forEach(prevent => {
    it(`Clawitzer does not pre-move the Special Energy (prevented=${prevent})`, () => {
      const game = setupGame({ turn: 4,
        player1: { active: { card: 'Clawitzer STS' }, bench: [{ card: 'M Sceptile-EX AOR' }],
          hand: ['Double Turbo Energy BRS'], deck: padDeck(10) },
        player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
      });
      const energy = game.player1.hand.cards[0];
      if (prevent) game.player1.bench[0].cannotAttachEnergyFromHandNextTurn = true;
      game.overridePrompt('Attach energy', () => [{ to: bench, index: 0 }]);
      if (prevent) expect(() => useAbility(game.store, game.state, 0, 'Mega Boost')).toThrow();
      else useAbility(game.store, game.state, 0, 'Mega Boost');
      expect(game.player1.hand.cards.includes(energy)).toBe(prevent);
      expect(game.player1.bench[0].energies.cards.includes(energy)).toBe(!prevent);
    });
  });
  it("N's Resolve leaves a prevented revealed energy in discard, not on the recipient", () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Ralts SIT' }, bench: [{ card: 'Latias FST 193' }], hand: ["N's Resolve CEC"],
        deck: ['Water Energy SVE', ...padDeck(12, 'Ralts SIT')] },
      player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
    });
    const energy = game.player1.deck.cards[0];
    game.player1.bench[0].getPokemonCard()!.reduceEffect = (_store, state, effect) => {
      if (effect instanceof AttachEnergyEffect) effect.preventDefault = true;
      return state;
    };
    playTrainerCard(game.store, game.state, 0, "N's Resolve CEC");
    expect(game.player1.discard.cards).toContain(energy);
    expect(game.player1.bench[0].energies.cards.length).toBe(0);
  });
  it('Red & Blue never post-moves an attachment that was prevented', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Eevee EVS' }, hand: ['Red & Blue CEC', 'Water Energy SVE', 'Water Energy SVE'],
        deck: ['Espeon-GX SUM', 'Psychic Energy SVE', ...padDeck(10)] },
      player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
    });
    const energy = game.player1.deck.cards.find(c => c.name === 'Psychic Energy')!;
    game.player1.active.getPokemonCard()!.reduceEffect = (_store, state, effect) => {
      if (effect instanceof AttachEnergyEffect) effect.preventDefault = true;
      return state;
    };
    // Source-boundary integration with real Store, but explicit prompt answers:
    // the generic auto-resolver re-enters a stale pending snapshot for this card's
    // pre-existing concurrent ShowCards/Shuffle/ChooseCards chain (logged separately).
    const store = new Store({ onStateChange() {} });
    store.state = game.state;
    const trainer = game.player1.hand.cards[0] as RedAndBlue;
    game.player1.hand.moveCardTo(trainer, game.player1.supporter);
    trainer.reduceEffect(store, game.state, new TrainerEffect(game.player1, trainer));
    let steps = 0;
    while (game.state.prompts.some(p => p.result === undefined)) {
      if (++steps > 20) throw new Error('Red & Blue prompt chain did not finish');
      const prompt = game.state.prompts.find(p => p.result === undefined)!;
      let raw: any = true;
      if (prompt instanceof ChooseCardsPrompt) {
        raw = prompt.cards.cards.map((card, index) => ({ card, index }))
          .filter(({ card, index }) => !prompt.options.blocked.includes(index)
            && Object.keys(prompt.filter).every(key => (prompt.filter as any)[key] === (card as any)[key]))
          .slice(0, prompt.options.max).map(item => item.index);
      } else if (prompt instanceof ChoosePokemonPrompt) raw = [active];
      else if (prompt instanceof ShuffleDeckPrompt) raw = game.player1.deck.cards.map((_, i) => i);
      const decoded = prompt.decode(raw, game.state);
      expect(prompt.validate(decoded, game.state)).toBe(true);
      store.dispatch(new ResolvePromptAction(prompt.id, decoded));
    }
    expect(game.player1.active.getPokemonCard()!.name).toBe('Espeon-GX');
    expect(game.player1.deck.cards).toContain(energy);
    expect(game.player1.active.energies.cards.length).toBe(0);
  });
});
