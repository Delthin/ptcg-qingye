import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_A_COIN_UNTIL_YOU_GET_TAILS_DO_X_DAMAGE_PER_HEADS } from '../../../game/store/prefabs/attack-effects';

export class Chansey extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 110;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Pound',
      cost: [C, C],
      damage: 40,
      text: '',
    },
    {
      name: 'Egg Rolling',
      cost: [C, C, C],
      damage: 60,
      damageCalculation: 'x',
      text: 'Flip a coin until you get tails. This attack does 60 damage for each heads.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '144';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Chansey';
  public fullName: string = 'Chansey SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = FLIP_A_COIN_UNTIL_YOU_GET_TAILS_DO_X_DAMAGE_PER_HEADS(store, state, effect, 60);
    }

    return state;
  }
}
