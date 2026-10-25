import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State, PowerType, GameMessage } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DrawPrizesEffect } from '../../../game/store/effects/game-effects';
import { KNOCK_OUT_DEFENDING_POKEMON_AT_END_OF_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/attack-effects';
import {
  ADD_SLEEP_TO_PLAYER_ACTIVE,
  AFTER_ATTACK,
  GET_PLAYER_BENCH_SLOTS,
  IS_ABILITY_BLOCKED,
  TAKE_SPECIFIC_PRIZES,
  TAKE_X_PRIZES,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

import { ConfirmCardsPrompt } from '../../../game/store/prompts/confirm-cards-prompt';

export class JirachiPrismStar extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  protected _tags = [CardTag.PRISM_STAR];
  public cardType: CardType[] = [M];
  public hp: number = 80;
  public weakness = [{ type: R }];
  public resistance = [{ type: P, value: -20 }];
  public retreat = [C];

  public powers = [
    {
      name: 'Wish Upon a Star',
      powerType: PowerType.ABILITY,
      exemptFromAbilityLock: true,
      text:
        "If you took this Pokémon as a face-down Prize card during your turn and your Bench isn't full, " +
        'before you put it into your hand, you may put it onto your Bench and take 1 more Prize card.',
    },
  ];

  public attacks = [
    {
      name: 'Perish Dream',
      cost: [C, C, C],
      damage: 10,
      text: "This Pokémon is now Asleep. At the end of your opponent's next turn, the Defending Pokémon will be Knocked Out.",
    },
  ];

  public set: string = 'CES';
  public setNumber: string = '97';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Jirachi Prism Star';
  public fullName: string = 'Jirachi Prism Star CES';

  public abilityUsed = false;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Ability
    if (effect instanceof DrawPrizesEffect) {
      return this.handlePrizeEffect(store, state, effect);
    }

    // Attack
    if (WAS_ATTACK_USED(effect, 0, this)) {
      KNOCK_OUT_DEFENDING_POKEMON_AT_END_OF_OPPONENTS_NEXT_TURN(store, state, effect, this);
    }

    if (AFTER_ATTACK(effect, 0, this)) {
      ADD_SLEEP_TO_PLAYER_ACTIVE(store, state, effect.player, this);
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

    // Check if ability conditions are met
    if (
      !prizeCard ||
      GET_PLAYER_BENCH_SLOTS(player).length === 0 ||
      !prizeCard.isSecret ||
      effect.destination !== player.hand ||
      state.players[state.activePlayer] !== player
    ) {
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
      TAKE_X_PRIZES(store, state, player, 1, {
        reservedPrizes: effect.prizeBatch
      }, () => effect.onComplete?.());
    });
  }
}
