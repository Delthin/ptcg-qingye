import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Persian extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Meowth';
  public cardType: CardType[] = [CardType.COLORLESS];
  public hp: number = 110;
  public weakness = [{ type: CardType.FIGHTING }];
  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Fury Swipes',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: 50,
      damageCalculation: 'x',
      text: 'Flip 3 coins. This attack does 50 damage for each heads.',
    },
    {
      name: 'Slashing Claw',
      cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
      damage: 100,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SFA';
  public setNumber: string = '49';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Persian';
  public fullName: string = 'Persian SFA';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 3, results => {
        const heads = results.filter(result => result).length;
        effect.damage = 50 * heads;
      });
    }

    return state;
  }
}
