import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class Koraidon extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 130;
  public weakness = [{ type: P }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Low Kick',
      cost: [F, F],
      damage: 50,
      text: '',
    },
    {
      name: 'Collision Course',
      cost: [F, F, C],
      damage: 140,
      text: 'Discard 2 [F] Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '86';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Koraidon';
  public fullName: string = 'Koraidon 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 2, CardType.FIGHTING);
    }

    return state;
  }
}
