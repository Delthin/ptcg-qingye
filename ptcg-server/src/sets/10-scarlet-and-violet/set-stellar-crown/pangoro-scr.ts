import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_CONFUSION_TO_PLAYER_ACTIVE,
  SWITCH_IN_OPPONENT_BENCHED_POKEMON,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Pangoro extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Pancham';
  public cardType: CardType[] = [D];
  public hp: number = 140;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Pull',
      cost: [D],
      damage: 0,
      text: 'Switch in 1 of your opponent\'s Benched Pokémon to the Active Spot.',
    },
    {
      name: 'Tantrum',
      cost: [D, D, C],
      damage: 160,
      text: 'This Pokémon is now Confused.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '93';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pangoro';
  public fullName: string = 'Pangoro SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Pull: Switch in 1 of your opponent's Benched Pokémon to the Active Spot.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, effect.player);
    }

    // Tantrum: This Pokémon is now Confused.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      ADD_CONFUSION_TO_PLAYER_ACTIVE(store, state, effect.player, this);
    }

    return state;
  }
}
