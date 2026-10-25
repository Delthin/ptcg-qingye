import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Bombirdier extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 100;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [{
    name: 'Reckless Charge',
    cost: [D, C],
    damage: 70,
    text: 'This Pokémon also does 20 damage to itself.'
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '97';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Bombirdier';
  public fullName: string = 'Bombirdier SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 20);
    }
    return state;
  }
}
