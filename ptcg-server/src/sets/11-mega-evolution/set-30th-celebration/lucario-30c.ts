import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_BENCHED_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Lucario extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public cardType: CardType[] = [F];
  public hp: number = 120;
  public weakness = [{ type: P }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Aura Sphere',
    cost: [F, F, C],
    damage: 100,
    text: 'This attack also does 60 damage to 1 of your opponent\'s Benched Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
  }];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '83';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lucario';
  public fullName: string = 'Lucario 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_BENCHED_POKEMON(60, effect, store, state);
    }
    return state;
  }
}
