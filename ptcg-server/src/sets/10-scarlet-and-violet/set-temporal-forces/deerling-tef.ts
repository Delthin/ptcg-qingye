import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class Deerling extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 70;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Flop',
      cost: [C],
      damage: 10,
      text: '',
    },
    {
      name: 'Leaf Litter Tackle',
      cost: [G, C, C],
      damage: 40,
      text: 'Discard a Grass Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '16';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Deerling';
  public fullName: string = 'Deerling TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 1, CardType.GRASS);
    }
    return state;
  }
}
