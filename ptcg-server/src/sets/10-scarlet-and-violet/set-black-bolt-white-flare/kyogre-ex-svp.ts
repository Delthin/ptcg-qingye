import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';
import {
  SWITCH_OUT_OPPONENT_ACTIVE_POKEMON,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Kyogreex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 230;
  public weakness = [{ type: L }];
  public retreat = [C, C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Winding Waves',
      cost: [W, C, C],
      damage: 80,
      text: 'You may switch out your opponent\'s Active Pokémon to the Bench. (Your opponent chooses the new Active Pokémon.)',
    },
    {
      name: 'Tidal Surge',
      cost: [W, W, C, C],
      damage: 230,
      text: 'Discard 2 Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '178';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Kyogre ex';
  public fullName: string = 'Kyogre ex SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = SWITCH_OUT_OPPONENT_ACTIVE_POKEMON(store, state, effect.player);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 2, {}, 2);
    }

    return state;
  }
}
