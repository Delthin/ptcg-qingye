import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON,
  THIS_POKEMON_CANNOT_USE_THIS_ATTACK_NEXT_TURN,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Zacianex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [M];
  public hp: number = 220;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Steel Armament',
      cost: [C],
      damage: 20,
      text: 'Search your deck for a Basic [M] Energy card and attach it to this Pokémon. Then, shuffle your deck.',
    },
    {
      name: 'Slashing Strike',
      cost: [M, M, C],
      damage: 210,
      text: 'During your next turn, this Pokémon can\'t use Slashing Strike.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '198';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Zacian ex';
  public fullName: string = 'Zacian ex SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Steel Armament: search deck for a Basic [M] Energy and attach it to this Pokémon,
    // then shuffle the deck (handled inside the compound helper).
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(store, state, player, 1, 1, {});
    }

    // Slashing Strike: this Pokémon can't use Slashing Strike during your next turn.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_CANNOT_USE_THIS_ATTACK_NEXT_TURN(effect.player, 'Slashing Strike');
    }

    return state;
  }
}
