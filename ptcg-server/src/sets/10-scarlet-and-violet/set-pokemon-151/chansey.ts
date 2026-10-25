import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State, GameMessage, PowerType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DrawPrizesEffect } from '../../../game/store/effects/game-effects';
import { CoinFlipEffect } from '../../../game/store/effects/play-card-effects';
import { GET_PLAYER_BENCH_SLOTS, IS_ABILITY_BLOCKED, TAKE_SPECIFIC_PRIZES, TAKE_X_PRIZES } from '../../../game/store/prefabs/prefabs';

import { ConfirmCardsPrompt } from '../../../game/store/prompts/confirm-cards-prompt';

export class Chansey extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 110;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public powers = [{
    name: 'Lucky Bonus',
    powerType: PowerType.ABILITY,
    exemptFromAbilityLock: true,
    text: 'If you took this Pokémon as a face-down Prize card during your turn and your Bench isn\'t full, ' +
      'before you put it into your hand, you may put it onto your Bench. If you put this Pokémon onto your ' +
      'Bench in this way, flip a coin. If heads, take 1 more Prize card.'
  }];

  public attacks = [{
    name: 'Gentle Slap',
    cost: [C, C, C],
    damage: 70,
    text: ''
  }];

  public set: string = 'MEW';
  public setNumber: string = '113';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Chansey';
  public fullName: string = 'Chansey MEW';

  public abilityUsed = false;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof DrawPrizesEffect) {
      return this.handlePrizeEffect(store, state, effect);
    }
    return state;
  }

  private handlePrizeEffect(store: StoreLike, state: State, effect: DrawPrizesEffect): State {
    const player = effect.player;
    const prizeCard = effect.prizes.find(cardList => cardList.cards.includes(this));

    // Check if ability conditions are met
    if (!prizeCard || GET_PLAYER_BENCH_SLOTS(player).length === 0 || !prizeCard.isSecret || effect.destination !== player.hand || state.players[state.activePlayer] !== player) {
      return state;
    }

    // Prevent unintended multiple uses
    if (this.abilityUsed) {
      return state;
    }

    // Check if ability is blocked
    if (IS_ABILITY_BLOCKED(store, state, player, this)) {
      return state;
    }

    // Prevent prize card from going to hand until we complete the ability flow
    effect.preventDefault = true;

    return store.prompt(state, new ConfirmCardsPrompt(
      player.id, GameMessage.WANT_TO_USE_ABILITY_FROM_PRIZES, [this],
      { allowCancel: true, prizeAction: 'ability' }
    ), result => {
      const slots = GET_PLAYER_BENCH_SLOTS(player);
      if (result !== true || slots.length === 0) {
        TAKE_SPECIFIC_PRIZES(store, state, player, [prizeCard], { skipReduce: true });
        effect.onComplete?.();
        return;
      }
      this.abilityUsed = true;
      prizeCard.moveCardTo(this, slots[0]);
      slots[0].pokemonPlayedTurn = state.turn;
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