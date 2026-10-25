import { MOVE_DAMAGE_FROM_YOUR_BENCH_TO_OPPONENTS_ACTIVE } from '../../../game/store/prefabs/prefabs';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { Effect } from '../../../game/store/effects/effect';
import { PokemonCard, StoreLike, State } from '../../../game';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';


export class Ninetales extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Vulpix';
  public hp: number = 120;
  public cardType: CardType[] = [R];
  public weakness = [{ type: W }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Nine-Tailed Transfer',
      cost: [R],
      damage: 0,
      text: "Move all damage counters from 1 of your Benched Pokémon to your opponent's Active Pokémon. ",
    },
    {
      name: 'Will-o-Wisp',
      cost: [R, R],
      damage: 70,
      text: '',
    },
  ];

  public regulationMark = 'J';
  public set: string = 'CRI';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '9';
  public name: string = 'Ninetales';
  public fullName: string = 'Ninetales M4';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Attack 1: Magical Echo
    // Ref: set-silver-tempest/altaria.ts (That one is AI-generated. Be warned)
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return MOVE_DAMAGE_FROM_YOUR_BENCH_TO_OPPONENTS_ACTIVE(store, state, effect);
    }

    return state;
  }
}
