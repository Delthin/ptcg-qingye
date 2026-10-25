import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Fletchinder extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Fletchling';
  public cardType: CardType[] = [R];
  public hp: number = 80;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [{
    name: 'Heat Dive',
    cost: [R],
    damage: 50,
    text: 'This Pokémon also does 10 damage to itself.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '29';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Fletchinder';
  public fullName: string = 'Fletchinder PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 10);
    }
    return state;
  }
}
