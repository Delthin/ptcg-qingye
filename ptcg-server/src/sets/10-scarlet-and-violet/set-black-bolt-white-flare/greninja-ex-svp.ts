import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, THIS_ATTACK_DOES_X_MORE_DAMAGE } from '../../../game/store/prefabs/prefabs';
import { THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Greninjaex extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Frogadier';
  public cardType: CardType[] = [W];
  public hp: number = 300;
  public weakness = [{ type: L }];
  public retreat = [C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Stealthy Shuriken',
      cost: [C],
      damage: 0,
      text: 'This attack does 40 damage to 1 of your opponent\'s Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
    },
    {
      name: 'Torrential Slash',
      cost: [W, W],
      damage: 120,
      damageCalculation: '+',
      text: 'If your opponent\'s Active Pokémon already has any damage counters on it, this attack does 120 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVP';
  public setNumber: string = '54';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Greninja ex';
  public fullName: string = 'Greninja ex SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_POKEMON(40, effect, store, state);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const opponent = effect.opponent;
      if (opponent.active.damage > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 120);
      }
    }

    return state;
  }
}
