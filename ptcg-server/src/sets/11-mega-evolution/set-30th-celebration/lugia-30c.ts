import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class Lugia extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 120;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Elemental Blast',
    cost: [R, W, L],
    damage: 250,
    text: 'Discard a Fire Energy, a Water Energy, and a Lightning Energy from this Pokémon.',
  }];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '121';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lugia';
  public fullName: string = 'Lugia 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DISCARD_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 1, CardType.FIRE);
      state = DISCARD_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 1, CardType.WATER);
      state = DISCARD_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 1, CardType.LIGHTNING);
    }
    return state;
  }
}
