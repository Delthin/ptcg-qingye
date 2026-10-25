import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  HEAL_X_DAMAGE_FROM_THIS_POKEMON,
  MULTIPLE_COIN_FLIPS_PROMPT,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Azumarill extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Marill';
  public cardType: CardType[] = [W];
  public hp: number = 120;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Bubble Drain',
      cost: [W, C],
      damage: 50,
      text: 'Heal 30 damage from this Pokémon.'
    },
    {
      name: 'Slam',
      cost: [W, C, C],
      damage: 100,
      damageCalculation: 'x',
      text: 'Flip 2 coins. This attack does 100 damage for each heads.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '45';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Azumarill';
  public fullName: string = 'Azumarill PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      HEAL_X_DAMAGE_FROM_THIS_POKEMON(effect, store, state, 30);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 2, results => {
        const heads = results.filter(result => result).length;
        effect.damage = 100 * heads;
      });
    }

    return state;
  }
}
