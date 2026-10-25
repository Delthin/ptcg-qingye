import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  HAS_CARD_IN_DISCARD,
  SWITCH_IN_OPPONENT_BENCHED_POKEMON,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';
import { THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_BENCHED_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Malamar extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Inkay';
  public cardType: CardType[] = [D];
  public hp: number = 120;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Colluding Tentacles',
      cost: [D],
      damage: 0,
      text: 'Switch in 1 of your opponent\'s Benched Pokémon to the Active Spot. If you do, this attack does 120 damage to the new Active Pokémon. If you didn\'t play Xerosic\'s Machinations from your hand during this turn, this attack does nothing.',
    },
    {
      name: 'Spinning Attack',
      cost: [D, C, C],
      damage: 90,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SFA';
  public setNumber: string = '34';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Malamar';
  public fullName: string = 'Malamar SFA';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Colluding Tentacles
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // If you didn't play Xerosic's Machinations from your hand during this turn,
      // this attack does nothing. A Supporter played from hand leaves the hand the
      // same turn, so its presence in the discard pile is used as the played marker.
      if (!HAS_CARD_IN_DISCARD(player, { name: 'Xerosic\'s Machinations' })) {
        return state;
      }

      // This attack does 120 damage to the Pokémon that gets switched in from the Bench.
      THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_BENCHED_POKEMON(120, effect, store, state);

      // Switch in 1 of your opponent's Benched Pokémon to the Active Spot.
      state = SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, player);
    }

    return state;
  }
}
