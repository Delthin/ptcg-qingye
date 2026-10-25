import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { CardType } from '../../game/store/card/card-types';
import { Effect } from '../../game/store/effects/effect';
import { MoveCardsEffect } from '../../game/store/effects/game-effects';
import { PlayCardAction, PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { Iono } from '../10-scarlet-and-violet/set-paldea-evolved/iono';
import { TeamRocketsArcher } from '../10-scarlet-and-violet/set-destined-rivals/team-rockets-archer';
import { Milotic } from '../09-sword-and-shield/set-evolving-skies/milotic';
import { GameError } from '../../game/game-error';
import { GameMessage } from '../../game/game-message';

class Plain extends PokemonCard {
  public name = 'Hand-order target';
  public fullName = 'Hand-order target TEST';
  public set = 'TEST';
  public hp = 500;
  public cardType = [CardType.COLORLESS];
}

function board(side: number, ownCards: number, opponentCards: number, protectedHand = false) {
  const state = new State();
  state.phase = GamePhase.PLAYER_TURN;
  state.turn = 5;
  state.activePlayer = side;
  state.players = [new Player(), new Player()];
  state.players[0].id = 17;
  state.players[1].id = 29;
  for (const p of state.players) {
    p.active.cards = [new Plain()];
    p.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    p.prizes = Array.from({ length: 6 }, () => { const pile = new CardList(); pile.cards = [new Plain()]; return pile; });
    p.deck.cards = Array.from({ length: 12 }, () => new Plain());
  }
  const player = state.players[side];
  const opponent = state.players[1 - side];
  const iono = new Iono();
  player.hand.cards = [iono, ...Array.from({ length: ownCards }, () => new Plain())];
  opponent.hand.cards = Array.from({ length: opponentCards }, () => new Plain());
  if (protectedHand) opponent.bench[0].cards = [new Milotic()];
  const draws: number[][] = [];
  class Witness extends Plain {
    public reduceEffect(_store: any, s: State, effect: Effect): State {
      if (effect instanceof MoveCardsEffect && effect.source === player.deck && effect.destination === player.hand) {
        draws.push([player.hand.cards.filter(c => c !== iono).length, opponent.hand.cards.length]);
      }
      return s;
    }
  }
  player.active.cards = [new Witness()];
  let id = 1;
  for (const p of state.players) {
    for (const pile of [p.active, ...p.bench, p.hand, p.deck, p.discard, p.supporter, ...p.prizes]) {
      for (const card of pile.cards) card.id = id++;
    }
  }
  const store = new Store({ onStateChange() {} }, false);
  store.state = state;
  const play = () => store.dispatch(new PlayCardAction(player.id, player.hand.cards.indexOf(iono), {
    player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0,
  }), player.id);
  const answerWait = () => {
    const prompt = store.state.prompts.find(p => p instanceof WaitPrompt && p.result === undefined);
    if (!prompt) throw new Error('Missing hand animation gate');
    const result = prompt.decode(null, store.state);
    expect(prompt.validate(result, store.state)).toBe(true);
    store.dispatch(new ResolvePromptAction(prompt.id, result), prompt.playerId);
  };
  const finish = () => {
    for (let i = 0; i < 8 && store.state.prompts.some(p => p.result === undefined); i++) answerWait();
    expect(store.state.prompts.filter(p => p.result === undefined).length).toBe(0);
  };
  return { state, store, player, opponent, iono, draws, play, answerWait, finish };
}

describe('Happy6 hand reset ordering and protection through PlayCardAction', () => {
  for (const side of [0, 1]) {
    it(`seat ${side}: both hands bottom before either prize-count draw and both gates finish`, () => {
      const g = board(side, 2, 2);
      const ownTop = g.player.deck.cards.slice(0, 6);
      const opponentTop = g.opponent.deck.cards.slice(0, 6);
      g.play();
      expect(g.player.hand.cards.length).toBe(0);
      expect(g.opponent.hand.cards.length).toBe(0);
      expect(g.draws.length).toBe(0);
      g.answerWait();
      expect(g.player.hand.cards.length).toBe(0);
      expect(g.opponent.hand.cards.length).toBe(0);
      g.finish();
      expect(g.draws).toEqual([[0, 0]]);
      expect(g.player.hand.cards).toEqual(ownTop);
      expect(g.opponent.hand.cards).toEqual(opponentTop);
      expect(g.player.deck.cards.length).toBe(8);
      expect(g.opponent.deck.cards.length).toBe(8);
    });
    it(`seat ${side}: opponent-only hand protected by Dew Guard means nobody bottomed or draws`, () => {
      const g = board(side, 0, 1, true);
      const hand = g.opponent.hand.cards.slice();
      g.play();
      g.finish();
      expect(g.player.hand.cards.length).toBe(0);
      expect(g.opponent.hand.cards).toEqual(hand);
      expect(g.player.deck.cards.length).toBe(12);
      expect(g.opponent.deck.cards.length).toBe(12);
      expect(g.draws.length).toBe(0);
    });
    it(`seat ${side}: protected empty opponent hand still ignores the opponent's draw effect`, () => {
      const g = board(side, 1, 0, true);
      g.play();
      g.finish();
      expect(g.player.hand.cards.length).toBe(6);
      expect(g.opponent.hand.cards.length).toBe(0);
      expect(g.opponent.deck.cards.length).toBe(12);
    });
  }
  it('Archer canPlay rejects a missing history marker as its real play does', () => {
    const g = board(0, 0, 0);
    const archer = new TeamRocketsArcher();
    archer.id = 9001;
    g.player.hand.cards = [archer];
    expect(archer.canPlay(g.store, g.state, g.player)).toBe(false);
    expect(() => g.store.dispatch(new PlayCardAction(g.player.id, 0, {
      player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0,
    }), g.player.id)).toThrow(new GameError(GameMessage.CANNOT_PLAY_THIS_CARD));
    expect(g.player.hand.cards).toEqual([archer]);
    expect(g.player.supporterTurn).toBe(0);
  });
});
