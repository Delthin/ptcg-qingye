import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED } from '../../../game/store/prefabs/attack-effects';
import { DISCARD_UP_TO_X_TYPE_ENERGY_FROM_YOUR_POKEMON } from '../../../game/store/prefabs/costs';

export class Bellibolt extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Tadbulb';
  public cardType: CardType[] = [L];
  public hp: number = 130;
  public weakness = [{ type: F }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Thunder Wave',
      cost: [L],
      damage: 0,
      text: 'Flip a coin. If heads, your opponent\'s Active Pokémon is now Paralyzed.'
    },
    {
      name: 'Two-Bump Bolt',
      cost: [L, L, C],
      damage: 10,
      damageCalculation: '+',
      text: 'You may discard up to 2 [L] Energy from this Pokémon. This attack does 80 more damage for each card you discarded in this way.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'SVP';
  public setNumber: string = '94';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Bellibolt';
  public fullName: string = 'Bellibolt SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = COIN_FLIP_PROMPT(store, state, effect.player, result => {
        if (result) {
          YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED(store, state, effect);
        }
      });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_UP_TO_X_TYPE_ENERGY_FROM_YOUR_POKEMON(
        store,
        state,
        effect,
        2,
        CardType.LIGHTNING,
        0,
        [SlotType.ACTIVE],
        transfers => {
          if (transfers.length > 0) {
            THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 80 * transfers.length);
          }
        },
      );
    }

    return state;
  }
}
