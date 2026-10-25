import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_SLEEP_TO_PLAYER_ACTIVE, SWITCH_IN_OPPONENT_BENCHED_POKEMON, WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Chimecho extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 70;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Sleep Inducer',
      cost: [C, C],
      damage: 0,
      text: 'Switch in 1 of your opponent\'s Benched Pokémon to the Active Spot. The new Active Pokémon is now Asleep.',
    },
    {
      name: 'Psyshot',
      cost: [P, C, C],
      damage: 70,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '30';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Chimecho';
  public fullName: string = 'Chimecho PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;

      if (opponent.bench.some(slot => slot.cards.length > 0)) {
        state = SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, effect.player);
        ADD_SLEEP_TO_PLAYER_ACTIVE(store, state, opponent, this);
      }
    }

    return state;
  }
}
