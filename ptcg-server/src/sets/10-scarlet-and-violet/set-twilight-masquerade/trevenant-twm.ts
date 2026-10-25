import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { HEAL_X_DAMAGE_FROM_THIS_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Trevenant extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Phantump';
  public cardType: CardType[] = [G];
  public hp: number = 120;
  public weakness = [{ type: R }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Giga Drain',
      cost: [G, C],
      damage: 50,
      text: 'Heal from this Pokémon the same amount of damage you did to your opponent\'s Active Pokémon.'
    },
    {
      name: 'Forest Dump',
      cost: [G, G, C],
      damage: 130,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '13';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Trevenant';
  public fullName: string = 'Trevenant TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      HEAL_X_DAMAGE_FROM_THIS_POKEMON(50, effect, store, state);
    }
    return state;
  }
}
