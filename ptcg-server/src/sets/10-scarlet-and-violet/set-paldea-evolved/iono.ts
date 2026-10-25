import { Effect } from '../../../game/store/effects/effect';
import { State } from '../../../game/store/state/state';
import { StateUtils } from '../../../game/store/state-utils';
import { StoreLike } from '../../../game/store/store-like';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType } from '../../../game/store/card/card-types';
import { Card, GameError, GameMessage, Player } from '../../../game';
import { TrainerEffect } from '../../../game/store/effects/play-card-effects';
import { DRAW_CARDS } from '../../../game/store/prefabs/prefabs';
import { MoveCardsEffect } from '../../../game/store/effects/game-effects';
import { WaitPrompt } from '../../../game/store/prompts/wait-prompt';
import { BOARD_ANIMATION_GATE_TIMEOUT_MS } from '../../../game/store/prefabs/deck-shuffle-animation';

export class Iono extends TrainerCard {
  public regulationMark = 'G';
  public trainerType: TrainerType = TrainerType.SUPPORTER;
  public set: string = 'PAL';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '185';
  public name: string = 'Iono';
  public fullName: string = 'Iono PAL';

  public text: string =
    'Each player shuffles their hand and puts it on the bottom of their deck. ' +
    'If either player put any cards on the bottom of their deck in this way, ' +
    'each player draws a card for each of their remaining Prize cards.';

  public canPlay(store: StoreLike, state: State, player: Player): boolean {
    if (player.supporterTurn > 0) {
      return false;
    }

    const opponent = StateUtils.getOpponent(state, player);
    const otherCardsInHand = player.hand.cards.filter(c => c !== this).length;

    if (otherCardsInHand === 0 && opponent.hand.cards.length === 0) {
      return false;
    }

    return true;
  }

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      if (player.supporterTurn > 0) {
        throw new GameError(GameMessage.SUPPORTER_ALREADY_PLAYED);
      }

      const playerCards = player.hand.cards.filter(c => c !== this);
      const opponentCards = [...opponent.hand.cards];

      if (playerCards.length === 0 && opponentCards.length === 0) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }

      this.shuffleCards(playerCards);
      this.shuffleCards(opponentCards);

      // Resolve both hand moves before either draw. Dispatch the empty-hand
      // move too, so Supporter protection also applies to that player's draw.
      const playerMove = new MoveCardsEffect(player.hand, player.deck, {
        cards: playerCards, sourceCard: this,
      });
      state = store.reduceEffect(state, playerMove);
      const opponentMove = new MoveCardsEffect(opponent.hand, opponent.deck, {
        cards: opponentCards, sourceCard: this,
      });
      state = store.reduceEffect(state, opponentMove);
      const playerMoved = !playerMove.preventDefault && playerCards.some(card => player.deck.cards.includes(card));
      const opponentMoved = !opponentMove.preventDefault && opponentCards.some(card => opponent.deck.cards.includes(card));
      const draw = (): void => {
        if (!playerMoved && !opponentMoved) return;
        if (!playerMove.preventDefault) DRAW_CARDS(store, state, player, player.getPrizeLeft());
        if (!opponentMove.preventDefault) DRAW_CARDS(store, state, opponent, opponent.getPrizeLeft());
      };
      const waits: WaitPrompt[] = [];
      if (playerMoved) waits.push(new WaitPrompt(player.id, BOARD_ANIMATION_GATE_TIMEOUT_MS, 'Hand to deck animation', false));
      if (opponentMoved) waits.push(new WaitPrompt(opponent.id, BOARD_ANIMATION_GATE_TIMEOUT_MS, 'Hand to deck animation', false));
      if (waits.length === 0) {
        draw();
        return state;
      }
      return store.prompt(state, waits, draw);
    }

    return state;
  }

  private shuffleCards(cards: Card[]): void {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }
}
