import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { HEAL_X_DAMAGE_FROM_THIS_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Dolliv extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Smoliv';
  public cardType: CardType[] = [G];
  public hp: number = 80;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [{
    name: 'Sunny Wind',
    cost: [G],
    damage: 30,
    text: 'Heal 30 damage from this Pokémon.',
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '20';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Dolliv';
  public fullName: string = 'Dolliv OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      HEAL_X_DAMAGE_FROM_THIS_POKEMON(30, effect, store, state);
    }
    return state;
  }
}
