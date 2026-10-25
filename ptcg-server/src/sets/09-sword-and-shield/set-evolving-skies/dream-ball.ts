import { TrainerCard } from '../../../game/store/card/trainer-card';
import { CardTag, TrainerType } from '../../../game/store/card/card-types';
import { DrawPrizesEffect } from '../../../game/store/effects/game-effects';
import { StoreLike, State, PokemonCard, GameError } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH,
  GET_PLAYER_BENCH_SLOTS,
  TAKE_SPECIFIC_PRIZES,
} from '../../../game/store/prefabs/prefabs';
import { GameMessage } from '../../../game/game-message';
import { TrainerEffect } from '../../../game/store/effects/play-card-effects';
import { ConfirmCardsPrompt } from '../../../game/store/prompts/confirm-cards-prompt';

export class DreamBall extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;

  public regulationMark = 'E';

  public set: string = 'EVS';

  public setNumber: string = '146';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Dream Ball';

  public fullName: string = 'Dream Ball EVS';

  public text: string =
    'You can play this card only if you took it as a face-down Prize card, before you put it into your hand. ' +
    `
    ` +
    'Search your deck for a Pokémon and put it onto your Bench. Then, shuffle your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
    }

    // Only act when this card is drawn as a Prize.
    if (effect instanceof DrawPrizesEffect) {
      return this.handlePrizeEffect(store, state, effect);
    }
    return state;
  }

  private handlePrizeEffect(
    store: StoreLike,
    state: State,
    effect: DrawPrizesEffect,
  ): State {
    const player = effect.player;
    const prizeCard = effect.prizes.find((cardList) => cardList.cards.includes(this));

    // Check if play conditions are met
    if (
      !prizeCard ||
      GET_PLAYER_BENCH_SLOTS(player).length === 0 ||
      !prizeCard.isSecret ||
      effect.destination !== player.hand
    ) {
      return state;
    }

    // Prevent prize card from going to hand until we complete the card effect flow
    effect.preventDefault = true;

    return store.prompt(state, new ConfirmCardsPrompt(
      player.id, GameMessage.WANT_TO_USE_ITEM_FROM_PRIZES, [this],
      { allowCancel: true, prizeAction: 'play' }
    ), result => {
      if (result !== true || GET_PLAYER_BENCH_SLOTS(player).length === 0) {
        TAKE_SPECIFIC_PRIZES(store, state, player, [prizeCard], { skipReduce: true });
        effect.onComplete?.();
        return;
      }
      prizeCard.moveCardTo(this, player.discard);
      if (player.deck.cards.length === 0) {
        effect.onComplete?.();
        return;
      }
      // Preserve the existing deck search and bench placement restrictions.
      const searchBlocked: number[] = [];
      player.deck.cards.forEach((card, index) => {
        if (card instanceof PokemonCard &&
          (card.hasTag(CardTag.POKEMON_LV_X) || card.hasTag(CardTag.LEGEND) ||
            card.hasTag(CardTag.BREAK) || card.hasTag(CardTag.POKEMON_VUNION))) {
          searchBlocked.push(index);
        }
      });
      SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH(
        store, state, player, {},
        { min: 1, max: 1, allowCancel: false, blocked: searchBlocked },
        () => effect.onComplete?.()
      );
    });
  }
}
