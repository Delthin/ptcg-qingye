import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_A_COIN_UNTIL_YOU_GET_TAILS_DO_X_DAMAGE_PER_HEADS } from '../../../game/store/prefabs/attack-effects';

export class Graveler extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Geodude';
  public cardType: CardType[] = [CardType.FIGHTING];
  public hp: number = 110;
  public weakness = [{ type: CardType.GRASS }];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Rock Cannon',
      cost: [CardType.FIGHTING],
      damage: 40,
      damageCalculation: 'x',
      text: 'Flip a coin until you get tails. This attack does 40 damage for each heads.',
    },
    {
      name: 'Heavy Impact',
      cost: [CardType.FIGHTING, CardType.COLORLESS, CardType.COLORLESS],
      damage: 60,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '75';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Graveler';
  public fullName: string = 'Graveler MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = FLIP_A_COIN_UNTIL_YOU_GET_TAILS_DO_X_DAMAGE_PER_HEADS(store, state, effect, 40);
    }
    return state;
  }
}
