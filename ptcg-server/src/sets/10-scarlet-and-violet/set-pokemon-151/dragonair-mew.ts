import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Dragonair extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Dratini';
  public cardType: CardType[] = [N];
  public hp: number = 100;
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Beat',
      cost: [W],
      damage: 20,
      text: '',
    },
    {
      name: 'Aqua Slash',
      cost: [W, L],
      damage: 90,
      text: 'During your next turn, this Pokémon can\'t attack.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '148';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Dragonair';
  public fullName: string = 'Dragonair MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN(effect.player);
    }
    return state;
  }
}
