import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON,
  THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Cyclizarex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 210;
  public weakness = [{ type: F }];
  public retreat = [C];

  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Power Run',
      cost: [C],
      damage: 30,
      text: 'Search your deck for a Basic Energy card and attach it to this Pokémon. Then, shuffle your deck.',
    },
    {
      name: 'Full Throttle',
      cost: [C, C, C],
      damage: 180,
      text: 'During your next turn, this Pokémon can\'t attack.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVP';
  public setNumber: string = '18';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Cyclizar ex';
  public fullName: string = 'Cyclizar ex SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Power Run: search the deck for a Basic Energy card and attach it, then shuffle.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(store, state, effect.player, 1, 1);
    }

    // Full Throttle: during your next turn, this Pokémon can't attack.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN(effect.player);
    }

    return state;
  }
}
