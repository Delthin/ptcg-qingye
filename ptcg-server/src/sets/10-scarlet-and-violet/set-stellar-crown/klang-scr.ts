import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Klang extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Klink';
  public cardType: CardType[] = [M];
  public hp: number = 90;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C, C];

  public attacks = [{
    name: 'Iron Tackle',
    cost: [C, C],
    damage: 60,
    text: 'This Pokémon also does 20 damage to itself.',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '100';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Klang';
  public fullName: string = 'Klang SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 20);
    }
    return state;
  }
}
