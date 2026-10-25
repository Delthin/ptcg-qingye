import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Excadrill extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Drilbur';
  public cardType: CardType[] = [F];
  public hp: number = 130;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Mud Shot',
      cost: [C],
      damage: 20,
      text: '',
    },
    {
      name: 'Wild Tackle',
      cost: [F, F, C],
      damage: 180,
      text: 'This Pokémon also does 50 damage to itself.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '86';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Excadrill';
  public fullName: string = 'Excadrill TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 50);
    }

    return state;
  }
}
