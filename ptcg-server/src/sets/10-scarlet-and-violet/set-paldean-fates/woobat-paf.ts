import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Woobat extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 60;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [{
    name: 'Reckless Charge',
    cost: [P],
    damage: 30,
    text: 'This Pokémon also does 10 damage to itself.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '32';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Woobat';
  public fullName: string = 'Woobat PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Reckless Charge: This Pokémon also does 10 damage to itself.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 10);
    }
    return state;
  }
}
