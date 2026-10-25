import { Store } from '../../game/store/store';
import { State, GamePhase, GameWinner } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { Card } from '../../game/store/card/card';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { GameMessage } from '../../game/game-message';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { AttachEnergyEffect } from '../../game/store/effects/play-card-effects';
import { ConfirmCardsPrompt } from '../../game/store/prompts/confirm-cards-prompt';
import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { ChooseCardsPrompt } from '../../game/store/prompts/choose-cards-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { ChoosePrizePrompt } from '../../game/store/prompts/choose-prize-prompt';
import { ShuffleDeckPrompt } from '../../game/store/prompts/shuffle-prompt';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { TAKE_SPECIFIC_PRIZES } from '../../game/store/prefabs/prefabs';
import { StateSanitizer } from '../../backend/socket/state-sanitizer';
import { StateSerializer } from '../../game/serializer/state-serializer';
import { TreasureEnergy } from '../09-sword-and-shield/set-evolving-skies/treasure-energy';
import { DreamBall } from '../09-sword-and-shield/set-evolving-skies/dream-ball';
import { GreedyDice } from '../07-x-and-y/set-steam-siege/greedy-dice';
import { Chansey } from '../10-scarlet-and-violet/set-pokemon-151/chansey';
import { JirachiPrismStar } from '../08-sun-and-moon/set-celestial-storm/jirachi-prism-star';
import { OldCemetery } from '../09-sword-and-shield/set-chilling-reign/old-cemetery';
import { CheckPrizesDestinationEffect } from '../../game/store/effects/check-effects';

class FixturePokemon extends PokemonCard {
  public set = 'TEST';
  public name = 'Fixture Pokemon';
  public fullName = 'Fixture Pokemon TEST';
  public hp = 100;
}
const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const bench = { ...active, slot: SlotType.BENCH, index: 1 };

function fixture(cards: Card[] = [new TreasureEnergy()]) {
  const state = new State();
  state.phase = GamePhase.PLAYER_TURN;
  state.turn = 4;
  const player = new Player();
  const opponent = new Player();
  player.id = 17;
  opponent.id = 29;
  state.players = [player, opponent];
  const register = <T extends Card>(card: T): T => {
    card.id = state.cardNames.length;
    state.cardNames.push(card.fullName);
    return card;
  };
  for (const p of state.players) {
    p.active.cards = [register(new FixturePokemon())];
    p.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    p.deck.isSecret = true;
    p.deck.cards = [register(new FixturePokemon()), register(new FixturePokemon())];
    p.prizes = Array.from({ length: 6 }, () => {
      const list = new CardList();
      list.isSecret = true;
      list.cards = [register(new FixturePokemon())];
      return list;
    });
  }
  cards.forEach((card, i) => player.prizes[i].cards = [register(card)]);
  player.bench[1].cards = [register(new FixturePokemon())];
  const store = new Store({ onStateChange() {} }, false);
  store.state = state;
  const pending = () => state.prompts.filter(p => p.result === undefined);
  const answer = (raw: any) => {
    const prompt = pending()[0];
    if (!prompt) throw new Error('No pending prompt');
    const decoded = prompt.decode(raw, state);
    expect(prompt.validate(decoded, state)).toBe(true);
    store.dispatch(new ResolvePromptAction(prompt.id, decoded));
  };
  const take = (indices = [0]) => TAKE_SPECIFIC_PRIZES(store, state, player, indices.map(i => player.prizes[i]));
  const counts = (n: number) => {
    expect(player.prizesTaken).toBe(n);
    expect(player.prizesTakenThisTurn).toBe(n);
    expect(player.gameStats.prizesTakenCount).toBe(n);
  };
  return { state, player, opponent, store, pending, answer, take, counts, register };
}

const families = [
  { create: () => new TreasureEnergy(), action: 'attach' },
  { create: () => new DreamBall(), action: 'play' },
  { create: () => new GreedyDice(), action: 'play' },
  { create: () => new Chansey(), action: 'ability' },
  { create: () => new JirachiPrismStar(), action: 'ability' },
];

describe('Optional face-down prize interactions through separate Store dispatches', () => {
  families.forEach(({ create, action }) => {
    it(`${create().name}: identifies just this physical card and cancel takes both selected prizes once`, () => {
      const card = create();
      const game = fixture([card, new FixturePokemon()]);
      const sibling = game.player.prizes[1].cards[0];
      game.take([0, 1]);
      expect(game.pending().length).toBe(1);
      const prompt = game.pending()[0] as ConfirmCardsPrompt;
      expect(prompt instanceof ConfirmCardsPrompt).toBe(true);
      expect(prompt.cards).toEqual([card]);
      expect((prompt.options as any).prizeAction).toBe(action);
      expect(prompt.options.allowCancel).toBe(true);
      game.answer(null);
      if (card instanceof Chansey || card instanceof JirachiPrismStar) expect(card.abilityUsed).toBe(false);
      if (card instanceof GreedyDice) expect(card.cardUsed).toBe(false);
      expect(game.player.hand.cards).toContain(card);
      expect(game.player.hand.cards).toContain(sibling);
      expect(game.pending().length).toBe(0);
      game.counts(2);
    });
  });

  it('Treasure attaches directly from the selected prize, not hand, without manual cost or Cemetery damage', () => {
    const energy = new TreasureEnergy();
    const other = new TreasureEnergy();
    const game = fixture([energy, other]);
    game.player.hand.cards = [game.register(new TreasureEnergy())];
    game.player.stadium.cards = [game.register(new OldCemetery())];
    game.player.bench[1].cannotAttachEnergyFromHandNextTurn = true;
    const manualTurn = game.player.energyPlayedTurn;
    const effects: AttachEnergyEffect[] = [];
    game.player.active.getPokemonCard()!.reduceEffect = (_store, state, effect) => {
      if (effect instanceof AttachEnergyEffect) effects.push(effect);
      return state;
    };
    game.take();
    game.answer(true);
    const prompt = game.pending()[0] as AttachEnergyPrompt;
    expect(prompt instanceof AttachEnergyPrompt).toBe(true);
    expect(prompt.cardList).toBe(game.player.prizes[0]);
    expect(prompt.cardList.cards).toEqual([energy]);
    expect(prompt.options.min).toBe(1);
    expect(prompt.options.max).toBe(1);
    expect(() => prompt.decode([{ to: { ...bench, player: PlayerType.TOP_PLAYER }, index: 0 }], game.state)).toThrow();
    expect(() => prompt.decode([{ to: { ...bench, index: 4 }, index: 0 }], game.state)).toThrow();
    expect(prompt.validate([{ to: bench, card: other }], game.state)).toBe(false);
    game.answer([{ to: bench, index: 0 }]);
    expect(effects.length).toBe(1);
    expect(effects[0].source).toBe(game.player.prizes[0]);
    expect(effects[0].isManual).toBe(false);
    expect(game.player.bench[1].cards).toContain(energy);
    expect(game.player.bench[1].energies.cards).toEqual([energy]);
    expect(game.player.bench[1].damage).toBe(0);
    expect(game.player.prizes[1].cards).toEqual([other]);
    expect(game.player.hand.cards.length).toBe(1);
    expect(game.player.energyPlayedTurn).toBe(manualTurn);
    expect(game.pending().length).toBe(0);
    game.counts(1);
  });

  ['cancel-attachment', 'all-lock', 'special-lock', 'prevented'].forEach(reason => {
    it(`Treasure ${reason} returns to hand and continues the batch`, () => {
      const energy = new TreasureEnergy();
      const game = fixture([energy]);
      const ordinary = game.player.prizes[1].cards[0];
      game.take([0, 1]);
      game.answer(true);
      if (reason === 'all-lock') game.player.cannotPlayEnergyCards = true;
      if (reason === 'special-lock') game.player.cannotPlaySpecialEnergyCards = true;
      if (reason === 'prevented') game.player.active.getPokemonCard()!.reduceEffect = (_store, state, effect) => {
        if (effect instanceof AttachEnergyEffect) effect.preventDefault = true;
        return state;
      };
      game.answer(reason === 'cancel-attachment' ? null : [{ to: active, index: 0 }]);
      expect(game.player.hand.cards).toContain(energy);
      expect(game.player.hand.cards).toContain(ordinary);
      expect(game.player.active.energies.cards.length).toBe(0);
      expect(game.pending().length).toBe(0);
      expect(game.player.energyPlayedTurn).toBe(0);
      game.counts(2);
    });
  });

  families.forEach(({ create }) => {
    it(`${create().name}: face-up and lost-zone destination do not offer use`, () => {
      const card = create();
      const game = fixture([card]);
      game.player.prizes[0].isSecret = false;
      game.take();
      expect(game.pending().length).toBe(0);
      expect(game.player.hand.cards).toContain(card);
      game.counts(1);
      const lost = fixture([create()]);
      // Exercise the destination override contract without unrelated card behavior.
      lost.opponent.active.getPokemonCard()!.reduceEffect = (_store, state, effect) => {
        if (effect instanceof CheckPrizesDestinationEffect) effect.destination = lost.player.lostzone;
        return state;
      };
      lost.player.lostzone.cards = Array.from({ length: 10 }, () => lost.register(new FixturePokemon()));
      const lostCard = lost.player.prizes[0].cards[0];
      lost.take();
      expect(lost.pending().length).toBe(0);
      expect(lost.player.lostzone.cards).toContain(lostCard);
      lost.counts(0);
    });
  });

  families.forEach(({ create, action }) => {
    it(`${create().name}: only cards whose text says during your turn are turn-restricted`, () => {
      const card = create();
      const game = fixture([card]);
      game.state.activePlayer = 1;
      game.take();
      if (action === 'play') {
        expect(game.pending()[0] instanceof ConfirmCardsPrompt).toBe(true);
        game.answer(null);
      } else expect(game.pending().length).toBe(0);
      expect(game.player.hand.cards).toContain(card);
      game.counts(1);
    });
  });

  it('two same-name special prizes are offered serially and leave no sibling behind', () => {
    const first = new TreasureEnergy();
    const second = new TreasureEnergy();
    const game = fixture([first, second]);
    let outerFinished = false;
    game.take([0, 1]);
    game.store.waitPrompt(game.state, () => outerFinished = true);
    expect(game.pending().length).toBe(1);
    expect((game.pending()[0] as ConfirmCardsPrompt).cards).toEqual([first]);
    game.answer(true);
    game.answer([{ to: active, index: 0 }]);
    expect(outerFinished).toBe(false);
    expect(game.pending().length).toBe(1);
    expect((game.pending()[0] as ConfirmCardsPrompt).cards).toEqual([second]);
    game.answer(null);
    expect(game.player.active.energies.cards).toEqual([first]);
    expect(game.player.hand.cards).toEqual([second]);
    expect(outerFinished).toBe(true);
    game.counts(2);
  });

  it('Dream Ball use keeps deck search, bench placement and shuffle, and takes the ordinary sibling', () => {
    const card = new DreamBall();
    const game = fixture([card]);
    const pokemon = game.player.deck.cards[0];
    const sibling = game.player.prizes[1].cards[0];
    game.take([0, 1]);
    game.answer(true);
    expect(game.pending()[0] instanceof ChooseCardsPrompt).toBe(true);
    game.answer([0]);
    if (game.pending()[0] instanceof ChoosePokemonPrompt) game.answer([{ ...active, slot: SlotType.BENCH, index: 0 }]);
    expect(game.pending()[0] instanceof ShuffleDeckPrompt).toBe(true);
    game.answer(game.player.deck.cards.map((_, i) => i));
    expect(game.pending()[0] instanceof WaitPrompt).toBe(true);
    game.answer(true);
    expect(game.player.discard.cards).toContain(card);
    expect(game.player.bench.some(p => p.cards.includes(pokemon))).toBe(true);
    expect(game.player.hand.cards).toContain(sibling);
    expect(game.pending().length).toBe(0);
    game.counts(2);
  });

  [false, true].forEach(heads => {
    [() => new GreedyDice(), () => new Chansey(), () => new JirachiPrismStar()].forEach(create => {
      it(`${create().name}: use with heads=${heads} counts original and bonus once, excluding reserved siblings`, () => {
        spyOn(Math, 'random').and.returnValue(heads ? 0.1 : 0.9);
        const card = create();
        const game = fixture([card, new TreasureEnergy()]);
        const reserved = game.player.prizes[1].cards[0];
        const bonus = game.player.prizes[2].cards[0];
        game.take([0, 1]);
        game.answer(true);
        if (game.pending()[0] instanceof WaitPrompt) game.answer(true);
        const bonusExpected = heads || card instanceof JirachiPrismStar;
        if (bonusExpected) {
          const prizePrompt = game.pending()[0] as ChoosePrizePrompt;
          expect(prizePrompt instanceof ChoosePrizePrompt).toBe(true);
          expect(prizePrompt.options.blocked).toContain(0);
          const reservedResult = prizePrompt.decode([0], game.state);
          expect(prizePrompt.validate(reservedResult, game.state)).toBe(false);
          expect(game.player.prizes[1].cards).toEqual([reserved]);
          game.answer([1]);
          expect(game.player.hand.cards).toContain(bonus);
        }
        expect(game.pending().length).toBe(1);
        expect((game.pending()[0] as ConfirmCardsPrompt).cards).toEqual([reserved]);
        game.answer(null);
        expect(game.player.hand.cards).toContain(reserved);
        if (card instanceof GreedyDice) expect(game.player.discard.cards).toContain(card);
        else expect(game.player.bench.some(p => p.cards.includes(card))).toBe(true);
        expect(game.pending().length).toBe(0);
        game.counts(bonusExpected ? 3 : 2);
      });
    });
  });

  it('nested bonus special prize completes before an enclosing reserved sibling is offered', () => {
    const jirachi = new JirachiPrismStar();
    const reserved = new TreasureEnergy();
    const bonus = new TreasureEnergy();
    const game = fixture([jirachi, reserved, bonus]);
    game.player.prizes.slice(3).forEach(prize => prize.cards = []);
    let finished = false;
    game.take([0, 1]);
    game.store.waitPrompt(game.state, () => finished = true);
    game.answer(true);
    // The only eligible bonus auto-selects, but must still finish its own interaction.
    expect((game.pending()[0] as ConfirmCardsPrompt).cards).toEqual([bonus]);
    expect(finished).toBe(false);
    game.answer(true);
    game.answer([{ to: active, index: 0 }]);
    expect((game.pending()[0] as ConfirmCardsPrompt).cards).toEqual([reserved]);
    expect(finished).toBe(false);
    game.answer(null);
    expect(finished).toBe(true);
    expect(game.player.active.energies.cards).toEqual([bonus]);
    expect(game.player.hand.cards).toEqual([reserved]);
    game.counts(3);
    expect(game.state.phase).toBe(GamePhase.FINISHED);
    expect(game.state.winner).toBe(GameWinner.PLAYER_1);
  });

  it('a bonus cannot consume the only remaining reserved sibling and does not hang', () => {
    const game = fixture([new JirachiPrismStar(), new TreasureEnergy()]);
    game.player.prizes.slice(2).forEach(prize => prize.cards = []);
    game.take([0, 1]);
    game.answer(true);
    expect(game.pending().length).toBe(1);
    expect((game.pending()[0] as ConfirmCardsPrompt).cards).toEqual(game.player.prizes[1].cards);
    game.answer(null);
    expect(game.pending().length).toBe(0);
    game.counts(2);
    expect(game.state.phase).toBe(GamePhase.FINISHED);
  });

  it('ordinary repeated prize references and empty slots do not inflate counts', () => {
    const game = fixture([new FixturePokemon()]);
    game.player.prizes[1].cards = [];
    game.take([0, 0, 1]);
    expect(game.pending().length).toBe(0);
    expect(game.player.hand.cards.length).toBe(1);
    game.counts(1);
  });

  it('unexpected attachment errors remain errors rather than successful prize completion', () => {
    const energy = new TreasureEnergy();
    const game = fixture([energy]);
    game.player.active.getPokemonCard()!.reduceEffect = (_store, state, effect) => {
      if (effect instanceof AttachEnergyEffect) throw new Error('fixture unexpected attachment failure');
      return state;
    };
    game.take();
    game.answer(true);
    expect(() => game.answer([{ to: active, index: 0 }])).toThrowError('fixture unexpected attachment failure');
    expect(game.player.prizes[0].cards).toEqual([energy]);
    expect(game.player.hand.cards.length).toBe(0);
    game.counts(0);
  });

  it('owner wire exposes only the selected physical prize; opponent and spectator expose neither copy', () => {
    const chosen = new TreasureEnergy();
    const sibling = new TreasureEnergy();
    const game = fixture([chosen, sibling]);
    game.take();
    const serializer = new StateSerializer();
    for (const phase of ['confirm', 'attach']) {
      if (phase === 'attach') game.answer(true);
      for (const playerId of [game.player.id, game.opponent.id, 999]) {
        const sanitized = StateSanitizer.sanitizeForViewer(game.state, { playerId, roleId: 1 });
        const wire = JSON.parse(serializer.serialize(sanitized))[1];
        expect(wire.cardNames[chosen.id]).toBe(playerId === game.player.id ? chosen.fullName : 'Unknown');
        expect(wire.cardNames[sibling.id]).toBe('Unknown');
        expect(sanitized.players[0].prizes[0].cards[0].name).toBe('Unknown');
        expect(sanitized.players[0].prizes[1].cards[0].name).toBe('Unknown');
        if (playerId === game.player.id) {
          if (phase === 'confirm') {
            expect(wire.prompts[0].options.prizeAction).toBe('attach');
            expect(wire.prompts[0].cards.length).toBe(1);
            expect((sanitized.prompts[0] as ConfirmCardsPrompt).cards[0].id).toBe(chosen.id);
          } else {
            const prompt = sanitized.prompts[0] as AttachEnergyPrompt;
            expect(prompt.cardList.cards.map(card => card.id)).toEqual([chosen.id]);
          }
        } else {
          expect((sanitized.prompts[0] as ConfirmCardsPrompt).cards).toBeUndefined();
          expect((sanitized.prompts[0] as AttachEnergyPrompt).cardList).toBeUndefined();
        }
      }
    }
    expect(game.player.prizes[0].cards[0]).toBe(chosen);
    expect(game.player.prizes[1].cards[0]).toBe(sibling);
  });

  it('ordinary ConfirmCardsPrompt keeps its existing true/null contract without prize metadata', () => {
    const prompt = new ConfirmCardsPrompt(17, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, [new TreasureEnergy()]);
    expect((prompt.options as any).prizeAction).toBeUndefined();
    expect(prompt.options.allowCancel).toBe(false);
    expect(prompt.decode(true, new State())).toBe(true);
    expect(prompt.validate(true, new State())).toBe(true);
  });
});
