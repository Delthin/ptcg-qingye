import { Store } from '../../game/store/store';
import { State, GamePhase, GameWinner } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { Card } from '../../game/store/card/card';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { CardTag } from '../../game/store/card/card-types';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { CheckHpEffect } from '../../game/store/effects/check-effects';
import { KnockOutEffect } from '../../game/store/effects/game-effects';
import { TrainerEffect } from '../../game/store/effects/play-card-effects';
import { checkState } from '../../game/store/effect-reducers/check-effect';
import { ConfirmCardsPrompt } from '../../game/store/prompts/confirm-cards-prompt';
import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { ChoosePrizePrompt } from '../../game/store/prompts/choose-prize-prompt';
import { ShowCardsPrompt } from '../../game/store/prompts/show-cards-prompt';
import { TreasureEnergy } from '../09-sword-and-shield/set-evolving-skies/treasure-energy';
import { ArcPhone } from '../09-sword-and-shield/set-lost-origin/arc-phone';
import { Gladion } from '../08-sun-and-moon/set-crimson-invasion/gladion';

class KoFixturePokemon extends PokemonCard {
  public set = 'TEST';
  public name = 'KO fixture';
  public fullName = 'KO fixture TEST';
  public hp = 100;
}

function fixture() {
  const state = new State();
  state.phase = GamePhase.PLAYER_TURN;
  state.turn = 4;
  state.players = [new Player(), new Player()];
  const [player, opponent] = state.players;
  player.id = 17;
  opponent.id = 29;
  const register = <T extends Card>(card: T): T => {
    card.id = state.cardNames.length;
    state.cardNames.push(card.fullName);
    return card;
  };
  for (const owner of state.players) {
    owner.active.cards = [register(new KoFixturePokemon())];
    owner.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    owner.deck.cards = [register(new KoFixturePokemon()), register(new KoFixturePokemon())];
    owner.prizes = Array.from({ length: 6 }, () => {
      const slot = new CardList();
      slot.isSecret = true;
      slot.cards = [register(new KoFixturePokemon())];
      return slot;
    });
  }
  const store = new Store({ onStateChange() {} }, false);
  store.state = state;
  const pending = () => state.prompts.filter(prompt => prompt.result === undefined);
  const answer = (raw: any) => {
    const prompt = pending()[0];
    if (!prompt) throw new Error('No pending prompt');
    const decoded = prompt.decode(raw, state);
    expect(prompt.validate(decoded, state)).toBe(true);
    store.dispatch(new ResolvePromptAction(prompt.id, decoded));
  };
  const counts = (count: number) => {
    expect(player.prizesTaken).toBe(count);
    expect(player.prizesTakenThisTurn).toBe(count);
    expect(player.gameStats.prizesTakenCount).toBe(count);
  };
  // Canonical physical zones, not prompt references or energies' derived mirrors.
  const physicalIds = () => state.players.reduce((cards: Card[], owner) => cards.concat(
    ...[owner.active, ...owner.bench, owner.hand, owner.deck, owner.discard,
      owner.supporter, owner.stadium, owner.lostzone, ...owner.prizes].map(zone => zone.cards)
  ), []).map(card => card.id).sort((a, b) => a - b);
  return { state, player, opponent, register, store, pending, answer, counts, physicalIds };
}

function prepareKo(remaining: number, lastPokemon: boolean, special = true) {
  const game = fixture();
  const { player, opponent, register } = game;
  // Keep the six real slots and move already claimed cards into hand.
  player.prizes.slice(remaining).forEach(slot => slot.moveTo(player.hand));
  const energy = special ? register(new TreasureEnergy()) : undefined;
  if (energy) {
    player.prizes[0].moveTo(player.deck);
    player.prizes[0].cards = [energy];
  }
  const ordinary = player.prizes[1].cards[0];
  const knockedOut = opponent.active.getPokemonCard()!;
  knockedOut.tags = [CardTag.POKEMON_V]; // Real KO reducer awards two prizes.
  opponent.active.damage = 100;
  if (!lastPokemon) opponent.bench[0].cards = [register(new KoFixturePokemon())];
  return { ...game, energy, ordinary, knockedOut };
}

const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };

describe('KO automatic prize continuation through real HP/KO reducers', () => {
  [false, true].forEach(useEnergy => {
    it(`last two prizes wait for the entire batch before ending, attach=${useEnergy}`, () => {
      const game = prepareKo(2, false);
      const before = game.physicalIds();
      const reduce = spyOn(game.store, 'reduceEffect').and.callThrough();
      let completed = 0;
      checkState(game.store, game.state, () => completed++);
      expect(reduce.calls.allArgs().some(args => args[1] instanceof CheckHpEffect)).toBe(true);
      expect(reduce.calls.allArgs().some(args => args[1] instanceof KnockOutEffect)).toBe(true);
      expect(game.opponent.discard.cards).toContain(game.knockedOut);
      expect(game.pending().length).toBe(1);
      expect(game.pending()[0] instanceof ConfirmCardsPrompt).toBe(true);
      expect(game.state.phase).not.toBe(GamePhase.FINISHED);
      expect(game.state.winner).toBe(GameWinner.NONE);
      expect(completed).toBe(0);
      expect(game.player.prizes[1].cards).toEqual([game.ordinary]);
      game.counts(0);
      expect(game.physicalIds()).toEqual(before);

      game.answer(useEnergy ? true : null);
      if (useEnergy) {
        expect(game.pending()[0] instanceof AttachEnergyPrompt).toBe(true);
        expect(game.state.phase).not.toBe(GamePhase.FINISHED);
        expect(game.state.winner).toBe(GameWinner.NONE);
        expect(completed).toBe(0);
        game.answer([{ to: active, index: 0 }]);
        expect(game.player.active.energies.cards).toEqual([game.energy!]);
      } else expect(game.player.hand.cards).toContain(game.energy!);

      expect(game.pending().length).toBe(0);
      expect(game.state.phase).toBe(GamePhase.FINISHED);
      expect(game.state.winner).toBe(GameWinner.PLAYER_1);
      expect(completed).toBe(1);
      expect(game.player.hand.cards).toContain(game.ordinary);
      expect(game.player.getPrizeLeft()).toBe(0);
      game.counts(2);
      expect(game.physicalIds()).toEqual(before);
    });
  });

  it('last opposing Pokemon also waits for automatic KO prizes before no-Pokemon victory', () => {
    const game = prepareKo(4, true);
    const before = game.physicalIds();
    let completed = 0;
    checkState(game.store, game.state, () => completed++);
    expect(game.pending()[0] instanceof ConfirmCardsPrompt).toBe(true);
    expect(game.state.phase).not.toBe(GamePhase.FINISHED);
    expect(completed).toBe(0);
    game.answer(null);
    expect(game.pending().length).toBe(0);
    expect(game.state.phase).toBe(GamePhase.FINISHED);
    expect(game.state.winner).toBe(GameWinner.PLAYER_1);
    expect(completed).toBe(1);
    expect(game.player.getPrizeLeft()).toBe(2);
    expect(game.player.hand.cards).toContain(game.energy!);
    expect(game.player.hand.cards).toContain(game.ordinary);
    game.counts(2);
    expect(game.physicalIds()).toEqual(before);
  });

  it('ordinary automatic last prizes still finish synchronously with one continuation', () => {
    const game = prepareKo(2, false, false);
    const before = game.physicalIds();
    let completed = 0;
    checkState(game.store, game.state, () => completed++);
    expect(game.pending().length).toBe(0);
    expect(game.state.phase).toBe(GamePhase.FINISHED);
    expect(game.state.winner).toBe(GameWinner.PLAYER_1);
    expect(completed).toBe(1);
    game.counts(2);
    expect(game.physicalIds()).toEqual(before);
  });

  it('sudden-death KO still ends immediately without opening optional prize interactions', () => {
    const game = prepareKo(4, false);
    game.state.isSuddenDeath = true;
    checkState(game.store, game.state);
    expect(game.state.phase).toBe(GamePhase.FINISHED);
    expect(game.state.winner).toBe(GameWinner.PLAYER_1);
    expect(game.pending().length).toBe(0);
    expect(game.player.prizes[0].cards).toEqual([game.energy!]);
    game.counts(0);
  });

  it('manual KO selection still finishes the batch before asking for the next active', () => {
    const game = prepareKo(4, false);
    const before = game.physicalIds();
    let completed = 0;
    checkState(game.store, game.state, () => completed++);
    expect(game.pending()[0] instanceof ChoosePrizePrompt).toBe(true);
    game.answer([0, 1]);
    expect(game.pending().length).toBe(1);
    expect(game.pending()[0] instanceof ConfirmCardsPrompt).toBe(true);
    expect(completed).toBe(0);
    game.answer(null);
    expect(game.pending()[0] instanceof ChoosePokemonPrompt).toBe(true);
    expect(completed).toBe(0);
    game.answer([{ ...active, slot: SlotType.BENCH, index: 0 }]);
    expect(completed).toBe(1);
    expect(game.pending().length).toBe(0);
    expect(game.state.phase).toBe(GamePhase.PLAYER_TURN);
    expect(game.state.winner).toBe(GameWinner.NONE);
    game.counts(2);
    expect(game.physicalIds()).toEqual(before);
  });
});

describe('Prize manipulation blocked indices use the nonempty wire sequence', () => {
  [() => new ArcPhone(), () => new Gladion()].forEach(create => {
    [false, true].forEach(withFaceUp => {
      it(`${create().name}: accepts slot 1 as compact index 0, face-up sibling=${withFaceUp}`, () => {
        const game = fixture();
        game.player.prizes.forEach((slot, index) => {
          if (index !== 1 && !(withFaceUp && index === 4)) slot.moveTo(game.player.hand);
          slot.isSecret = index === 1;
        });
        const slot = game.player.prizes[1];
        const selected = slot.cards[0];
        const faceUp = withFaceUp ? game.player.prizes[4].cards[0] : undefined;
        const deckTop = game.player.deck.cards[0];
        const trainer = game.register(create());
        game.player.hand.cards.push(trainer);
        const before = game.physicalIds();
        game.store.reduceEffect(game.state, new TrainerEffect(game.player, trainer));
        if (game.pending()[0] instanceof ShowCardsPrompt) game.answer(true);
        const prompt = game.pending()[0] as ChoosePrizePrompt;
        expect(prompt instanceof ChoosePrizePrompt).toBe(true);
        expect(prompt.options.blocked).toEqual(withFaceUp ? [1] : []);
        expect(prompt.decode([0], game.state)).toEqual([slot]);
        expect(prompt.validate(prompt.decode([0], game.state), game.state)).toBe(true);
        if (withFaceUp) {
          expect(prompt.decode([1], game.state)).toEqual([game.player.prizes[4]]);
          expect(prompt.validate(prompt.decode([1], game.state), game.state)).toBe(false);
        }
        game.answer([0]);
        expect(game.pending().length).toBe(0);
        if (trainer instanceof ArcPhone) {
          expect(game.player.deck.cards[0]).toBe(selected);
          expect(slot.cards).toEqual([deckTop]);
        } else {
          expect(game.player.hand.cards).toContain(selected);
          expect(slot.cards).toEqual([trainer]);
        }
        expect(slot.isSecret).toBe(true);
        if (withFaceUp) {
          expect(game.player.prizes[4].cards).toEqual([faceUp!]);
          expect(game.player.prizes[4].isSecret).toBe(false);
        }
        expect(game.player.prizes[0].cards.length).toBe(0);
        game.counts(0);
        expect(game.physicalIds()).toEqual(before);
      });
    });
  });

  it('Arc Phone cancellation with holes restores deck top and leaves the eligible prize untouched', () => {
    const game = fixture();
    game.player.prizes.forEach((slot, i) => {
      if (i !== 1) slot.moveTo(game.player.hand);
      slot.isSecret = i === 1;
    });
    const selected = game.player.prizes[1].cards[0];
    const top = game.player.deck.cards[0];
    const trainer = game.register(new ArcPhone());
    game.player.hand.cards.push(trainer);
    const before = game.physicalIds();
    game.store.reduceEffect(game.state, new TrainerEffect(game.player, trainer));
    game.answer(true); // Look at the deck's top card.
    expect(game.pending()[0] instanceof ChoosePrizePrompt).toBe(true);
    game.answer(null);
    expect(game.pending().length).toBe(0);
    expect(game.player.deck.cards[0]).toBe(top);
    expect(game.player.prizes[1].cards).toEqual([selected]);
    expect(game.player.prizes[1].isSecret).toBe(true);
    game.counts(0);
    expect(game.physicalIds()).toEqual(before);
  });
});
