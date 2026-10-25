import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SpecialCondition } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  WAS_ATTACK_USED,
  COIN_FLIP_PROMPT,
  ADD_PARALYZED_TO_PLAYER_ACTIVE,
  ADD_POISON_TO_PLAYER_ACTIVE,
  THIS_ATTACK_DOES_X_MORE_DAMAGE
} from '../../../game/store/prefabs/prefabs';

export class Glimmora extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Glimmet';
  public cardType: CardType[] = [F];
  public hp: number = 130;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Stun Poison',
      cost: [C],
      damage: 0,
      text: 'Flip a coin. If heads, your opponent\'s Active Pokémon is now Paralyzed and Poisoned.'
    },
    {
      name: 'Venoshock',
      cost: [F],
      damage: 30,
      damageCalculation: '+',
      text: 'If your opponent\'s Active Pokémon is Poisoned, this attack does 100 more damage.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '109';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Glimmora';
  public fullName: string = 'Glimmora TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;

      state = COIN_FLIP_PROMPT(store, state, effect.player, result => {
        if (result) {
          ADD_PARALYZED_TO_PLAYER_ACTIVE(store, state, opponent, this);
          ADD_POISON_TO_PLAYER_ACTIVE(store, state, opponent, this);
        }
      });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const opponent = effect.opponent;

      if (opponent.active.specialConditions.includes(SpecialCondition.POISONED)) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 100);
      }
    }

    return state;
  }
}
