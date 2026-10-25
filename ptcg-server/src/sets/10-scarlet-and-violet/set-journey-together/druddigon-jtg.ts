import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  WAS_ATTACK_USED,
  ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON
} from '../../../game/store/prefabs/prefabs';

export class Druddigon extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [N];
  public hp: number = 120;
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Dragon\'s Fury',
      cost: [C],
      damage: 20,
      text: 'Attach a Basic [R] Energy card from your discard pile to 1 of your Dragon Pokémon.'
    },
    {
      name: 'Slashing Claw',
      cost: [R, W, C],
      damage: 120,
      text: ''
    }
  ];

  public regulationMark = 'I';
  public set: string = 'JTG';
  public setNumber: string = '115';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Druddigon';
  public fullName: string = 'Druddigon JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON(
        store, state, effect.player, 1, R
      );
    }
    return state;
  }
}
