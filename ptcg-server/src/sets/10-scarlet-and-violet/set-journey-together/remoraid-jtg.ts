import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Remoraid extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 60;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Flail',
      cost: [W],
      damage: 10,
      damageCalculation: 'x',
      text: 'This attack does 10 damage for each damage counter on this Pokémon.'
    },
    {
      name: 'Rain Splash',
      cost: [C, C],
      damage: 20,
      text: ''
    }
  ];

  public regulationMark = 'I';
  public set: string = 'JTG';
  public setNumber: string = '33';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Remoraid';
  public fullName: string = 'Remoraid JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const damageCounters = Math.floor(effect.source.damage / 10);
      effect.damage = 10 * damageCounters;
    }
    return state;
  }
}
