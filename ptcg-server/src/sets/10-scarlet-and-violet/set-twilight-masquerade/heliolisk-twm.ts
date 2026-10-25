import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Heliolisk extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Helioptile';
  public cardType: CardType[] = [L];
  public hp: number = 100;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [{
    name: 'Wild Charge',
    cost: [L],
    damage: 70,
    text: 'This Pokémon also does 20 damage to itself.',
  }];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '71';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Heliolisk';
  public fullName: string = 'Heliolisk TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 20);
    }
    return state;
  }
}
