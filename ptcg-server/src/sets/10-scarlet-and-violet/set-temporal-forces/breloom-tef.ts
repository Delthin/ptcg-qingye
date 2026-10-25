import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Breloom extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Shroomish';
  public cardType: CardType[] = [G];
  public hp: number = 120;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Punch',
      cost: [C],
      damage: 30,
      text: '',
    },
    {
      name: 'Knuckle Impact',
      cost: [G, C],
      damage: 120,
      text: 'During your next turn, this Pokémon can\'t attack.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '7';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Breloom';
  public fullName: string = 'Breloom TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN(effect.player);
    }
    return state;
  }
}
