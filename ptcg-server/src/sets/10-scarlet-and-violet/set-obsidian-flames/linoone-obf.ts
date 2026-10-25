import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Linoone extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Zigzagoon';
  public cardType: CardType[] = [C];
  public hp: number = 110;
  public weakness = [{ type: F }];
  public retreat = [];

  public attacks = [
    {
      name: 'Jet Headbutt',
      cost: [C],
      damage: 40,
      text: ''
    },
    {
      name: 'Reckless Charge',
      cost: [C, C, C],
      damage: 150,
      text: 'This Pokémon also does 30 damage to itself.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '168';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Linoone';
  public fullName: string = 'Linoone OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 30);
    }

    return state;
  }
}
