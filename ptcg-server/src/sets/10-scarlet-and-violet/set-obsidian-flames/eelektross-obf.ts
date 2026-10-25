import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import {
  ADD_PARALYZED_TO_PLAYER_ACTIVE,
  COIN_FLIP_PROMPT,
  SWITCH_IN_OPPONENT_BENCHED_POKEMON,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Eelektross extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Eelektrik';
  public cardType: CardType[] = [L];
  public hp: number = 160;
  public weakness = [{ type: F }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Suction Shock',
      cost: [L],
      damage: 0,
      text: 'Switch in 1 of your opponent\'s Benched Pokémon to the Active Spot. If you do, this attack does 60 damage to the new Active Pokémon, and then flip a coin. If heads, that Pokémon is now Paralyzed.'
    },
    {
      name: 'Head Bolt',
      cost: [L, C, C],
      damage: 130,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '69';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Eelektross';
  public fullName: string = 'Eelektross OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const attackEffect = effect;
      const player = attackEffect.player;
      const opponent = StateUtils.getOpponent(state, player);

      const hasBench = opponent.bench.some(bench => bench.cards.length > 0);
      if (!hasBench) {
        return state;
      }

      const previousActive = opponent.active;

      // Switch in 1 of your opponent's Benched Pokemon to the Active Spot.
      state = SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, player);

      // The coin flip prompt is queued after the switch prompt, so the new
      // Active Pokemon is already in place when damage and the Special
      // Condition are applied.
      state = COIN_FLIP_PROMPT(store, state, player, result => {
        const newActive = opponent.active;

        // If you do ... (nothing happens when no Pokemon was switched in).
        if (newActive === previousActive || newActive.cards.length === 0) {
          return;
        }

        const damageEffect = new PutDamageEffect(attackEffect, 60);
        damageEffect.target = newActive;
        store.reduceEffect(state, damageEffect);

        if (result) {
          ADD_PARALYZED_TO_PLAYER_ACTIVE(store, state, opponent, this);
        }
      });
    }

    return state;
  }
}
