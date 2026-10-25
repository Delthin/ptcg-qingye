import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  DISCARD_A_STADIUM_CARD_IN_PLAY,
  THIS_POKEMON_DOES_DAMAGE_TO_ITSELF,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class GreatTuskex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 250;
  public weakness = [{ type: P }];
  public retreat = [C, C, C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Bedrock Breaker',
      cost: [F],
      damage: 40,
      text: 'Discard a Stadium in play.',
    },
    {
      name: 'Gigantic Tusks',
      cost: [F, F, F],
      damage: 250,
      text: 'This Pokémon also does 50 damage to itself.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '123';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Great Tusk ex';
  public fullName: string = 'Great Tusk ex SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      DISCARD_A_STADIUM_CARD_IN_PLAY(state);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 50);
    }

    return state;
  }
}
