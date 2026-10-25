import { GameError } from '../../../game';
import { GameMessage } from '../../../game/game-message';
import { TrainerType } from '../../../game/store/card/card-types';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { Effect } from '../../../game/store/effects/effect';
import { DrawPrizesEffect } from '../../../game/store/effects/game-effects';
import { CoinFlipEffect, TrainerEffect } from '../../../game/store/effects/play-card-effects';
import { TAKE_SPECIFIC_PRIZES, TAKE_X_PRIZES } from '../../../game/store/prefabs/prefabs';
import { State } from '../../../game/store/state/state';
import { StoreLike } from '../../../game/store/store-like';
import { ConfirmCardsPrompt } from '../../../game/store/prompts/confirm-cards-prompt';

export class GreedyDice extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;
  public set: string = 'STS';
  public setNumber: string = '102';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Greedy Dice';
  public fullName: string = 'Greedy Dice STS';
  public text: string = 'You can play this card only if you took it as a face-down Prize card, before you put it into your hand.' +
    `
    ` +
    'Flip a coin. If heads, take 1 more Prize card.';

  public cardUsed = false;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
    }

    if (effect instanceof DrawPrizesEffect) {
      return this.handlePrizeEffect(store, state, effect);
    }
    return state;
  }

  private handlePrizeEffect(store: StoreLike, state: State, effect: DrawPrizesEffect): State {
    const player = effect.player;
    const prizeCard = effect.prizes.find(cardList => cardList.cards.includes(this));

    // Check if play conditions are met
    if (!prizeCard || !prizeCard.isSecret || effect.destination !== player.hand) {
      return state;
    }

    // Prevent unintended multiple uses
    if (this.cardUsed) {
      return state;
    }

    // Prevent prize card from going to hand until we complete the card effect flow
    effect.preventDefault = true;

    return store.prompt(state, new ConfirmCardsPrompt(
      player.id, GameMessage.WANT_TO_USE_ITEM_FROM_PRIZES, [this],
      { allowCancel: true, prizeAction: 'play' }
    ), result => {
      if (result !== true) {
        TAKE_SPECIFIC_PRIZES(store, state, player, [prizeCard], { skipReduce: true });
        effect.onComplete?.();
        return;
      }
      this.cardUsed = true;
      prizeCard.moveCardTo(this, player.discard);
      store.reduceEffect(state, new CoinFlipEffect(player, heads => {
        if (!heads) {
          effect.onComplete?.();
          return;
        }
        TAKE_X_PRIZES(store, state, player, 1, {
          reservedPrizes: effect.prizeBatch
        }, () => effect.onComplete?.());
      }));
    });
  }

}
