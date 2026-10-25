import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  DAMAGE_OPPONENT_POKEMON,
  SWITCH_IN_OPPONENT_BENCHED_POKEMON,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Braviary extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Rufflet';
  public cardType: CardType[] = [C];
  public hp: number = 130;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Drag Off',
      cost: [C, C],
      damage: 0,
      text: 'Switch in 1 of your opponent\'s Benched Pokémon to the Active Spot. This attack does 40 damage to the new Active Pokémon.'
    },
    {
      name: 'Blasting Wind',
      cost: [C, C, C],
      damage: 120,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '153';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Braviary';
  public fullName: string = 'Braviary SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      // Nothing to drag out if the opponent has no Benched Pokémon.
      const hasBenched = opponent.bench.some(bench => bench.cards.length > 0);
      if (!hasBenched) {
        return state;
      }

      // Switch in 1 of your opponent's Benched Pokémon to the Active Spot.
      state = SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, player);

      // This attack does 40 damage to the new Active Pokémon.
      DAMAGE_OPPONENT_POKEMON(store, state, effect, 40, [opponent.active]);

      return state;
    }

    return state;
  }
}
