import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN } from '../../../game/store/prefabs/prefabs';

export class Crabominable extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Crabrawler';
  public cardType: CardType[] = [F];
  public hp: number = 160;
  public weakness = [{ type: P }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Confront',
      cost: [F, C],
      damage: 50,
      text: '',
    },
    {
      name: 'Knuckle Impact',
      cost: [F, F, C],
      damage: 170,
      text: 'During your next turn, this Pokémon can\'t attack.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '115';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Crabominable';
  public fullName: string = 'Crabominable OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN(effect.player);
    }
    return state;
  }
}
