import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class HeatRotom extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 90;
  public weakness = [{ type: W }];
  public retreat = [C];

  public attacks = [{
    name: 'Heat Tackle',
    cost: [R, R],
    damage: 100,
    text: 'This Pokémon also does 40 damage to itself.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '13';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Heat Rotom';
  public fullName: string = 'Heat Rotom PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 40);
    }
    return state;
  }
}
