import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_RETREAT_COSTS_MORE } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Grimer extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 80;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Gummy Press',
    cost: [D],
    damage: 10,
    text: 'During your opponent\'s next turn, the Defending Pokémon\'s Retreat Cost is Colorless more.',
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '88';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Grimer';
  public fullName: string = 'Grimer MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DEFENDING_POKEMON_RETREAT_COSTS_MORE(store, state, effect, 1);
    }
    return state;
  }
}
