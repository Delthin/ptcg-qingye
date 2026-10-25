import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SpecialCondition } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED } from '../../../game/store/prefabs/attack-effects';

export class TapuLele extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 110;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Perplex',
      cost: [C, C],
      damage: 20,
      text: 'Your opponent\'s Active Pokémon is now Confused.',
    },
    {
      name: 'Mental Crush',
      cost: [P, C, C],
      damage: 90,
      damageCalculation: '+',
      text: 'If your opponent\'s Active Pokémon is Confused, this attack does 90 more damage.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '92';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tapu Lele';
  public fullName: string = 'Tapu Lele SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Perplex: the opponent's Active Pokémon is now Confused.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
    }

    // Mental Crush: +90 damage if the opponent's Active Pokémon is Confused.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      if (effect.opponent.active.specialConditions.includes(SpecialCondition.CONFUSED)) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 90);
      }
    }

    return state;
  }
}
