import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Growlithe extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 80;
  public weakness = [{ type: W }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Vaporize',
    cost: [R],
    damage: 10,
    text: 'Discard a Water Energy from your opponent\'s Active Pokémon.'
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '58';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Growlithe';
  public fullName: string = 'Growlithe MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON(
        store, state, effect, [CardType.WATER], 1
      );
    }
    return state;
  }
}
