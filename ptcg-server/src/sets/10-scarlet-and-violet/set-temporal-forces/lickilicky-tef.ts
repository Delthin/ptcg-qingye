import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  COIN_FLIP_PROMPT, MULTIPLE_COIN_FLIPS_PROMPT, THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED } from '../../../game/store/prefabs/attack-effects';

export class Lickilicky extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Lickitung';
  public cardType: CardType[] = [C];
  public hp: number = 150;
  public weakness = [{ type: F }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Body Slam',
      cost: [C, C],
      damage: 50,
      text: 'Flip a coin. If heads, your opponent\'s Active Pokémon is now Paralyzed.'
    },
    {
      name: 'Tonguenado',
      cost: [C, C, C, C],
      damage: 70,
      damageCalculation: 'x',
      text: 'Flip 4 coins. This attack does 70 damage for each heads.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '125';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lickilicky';
  public fullName: string = 'Lickilicky TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED(store, state, effect);
        }
      });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      // Base damage comes entirely from the coin flips.
      effect.damage = 0;

      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 4, results => {
        const heads = results.filter(r => r).length;
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 70 * heads);
      });
    }

    return state;
  }
}
