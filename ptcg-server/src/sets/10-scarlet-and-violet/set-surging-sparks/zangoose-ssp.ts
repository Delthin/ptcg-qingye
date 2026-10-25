import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  MULTIPLE_COIN_FLIPS_PROMPT,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Zangoose extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 90;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Fury Cutter',
      cost: [C],
      damage: 10,
      damageCalculation: '+' as const,
      text: 'Flip 3 coins. If 1 of them is heads, this attack does 20 more damage. If 2 of them are heads, this attack does 50 more damage. If all of them are heads, this attack does 80 more damage.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '149';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Zangoose';
  public fullName: string = 'Zangoose SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 3, results => {
        const heads = results.filter(result => result).length;

        let bonusDamage = 0;
        if (heads === 1) {
          bonusDamage = 20;
        } else if (heads === 2) {
          bonusDamage = 50;
        } else if (heads === 3) {
          bonusDamage = 80;
        }

        if (bonusDamage > 0) {
          THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, bonusDamage);
        }
      });
    }

    return state;
  }
}
