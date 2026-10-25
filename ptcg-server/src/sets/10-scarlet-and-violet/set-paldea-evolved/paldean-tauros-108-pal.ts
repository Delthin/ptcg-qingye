import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  THIS_POKEMON_DOES_DAMAGE_TO_ITSELF,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class PaldeanTauros2 extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 130;
  public weakness = [{ type: P }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Raging Horns',
      cost: [C, C],
      damage: 20,
      damageCalculation: '+',
      text: 'This attack does 10 more damage for each damage counter on this Pokémon.'
    },
    {
      name: 'Combat Tackle',
      cost: [F, F, C],
      damage: 130,
      text: 'This Pokémon also does 30 damage to itself.'
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '108';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Paldean Tauros';
  public fullName: string = 'Paldean Tauros PAL 108';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const damageCounters = Math.floor(effect.source.damage / 10);
      if (damageCounters > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, damageCounters * 10);
      }
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 30);
    }

    return state;
  }
}
