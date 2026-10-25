import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Granbull extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Snubbull';
  public cardType: CardType[] = [P];
  public hp: number = 130;
  public weakness = [{ type: M }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Confront',
      cost: [P, C],
      damage: 50,
      text: '',
    },
    {
      name: 'Wild Tackle',
      cost: [P, P, C],
      damage: 160,
      text: 'This Pokémon also does 30 damage to itself.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '88';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Granbull';
  public fullName: string = 'Granbull OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 30);
    }

    return state;
  }
}
