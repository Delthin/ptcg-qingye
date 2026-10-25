import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class PaldeanTauros extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 130;
  public weakness = [{ type: L }];
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
      name: 'Aqua Dive',
      cost: [W, C, C],
      damage: 0,
      text: 'This attack does 60 damage to 1 of your opponent\'s Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)'
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '120';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Paldean Tauros';
  public fullName: string = 'Paldean Tauros PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const damageCounters = Math.floor(player.active.damage / 10);
      if (damageCounters > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, damageCounters * 10);
      }
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_POKEMON(60, effect, store, state);
    }

    return state;
  }
}
