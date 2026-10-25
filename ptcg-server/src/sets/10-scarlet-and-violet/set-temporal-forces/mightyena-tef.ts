import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, SWITCH_OUT_OPPONENT_ACTIVE_POKEMON } from '../../../game/store/prefabs/prefabs';

export class Mightyena extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Poochyena';
  public cardType: CardType[] = [D];
  public hp: number = 120;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Kick Away',
      cost: [D, C],
      damage: 50,
      text: 'Switch out your opponent\'s Active Pokémon to the Bench. (Your opponent chooses the new Active Pokémon.)'
    },
    {
      name: 'Sharp Fang',
      cost: [D, D, C],
      damage: 130,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '106';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mightyena';
  public fullName: string = 'Mightyena TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = SWITCH_OUT_OPPONENT_ACTIVE_POKEMON(store, state, player);
    }
    return state;
  }
}
