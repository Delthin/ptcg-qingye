import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_CANNOT_ATTACK } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Frosmoth extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Snom';
  public cardType: CardType[] = [W];
  public hp: number = 110;
  public weakness = [{ type: M }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Freezing Chill',
    cost: [W, W],
    damage: 100,
    text: 'During your opponent\'s next turn, the Defending Pokémon can\'t attack.',
  }];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '46';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Frosmoth';
  public fullName: string = 'Frosmoth TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return DEFENDING_POKEMON_CANNOT_ATTACK(store, state, effect, this);
    }
    return state;
  }
}
