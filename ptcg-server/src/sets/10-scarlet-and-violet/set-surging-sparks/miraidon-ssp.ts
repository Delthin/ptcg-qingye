import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { PREVENT_DAMAGE } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Miraidon extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'C.O.D.E.: Protect',
      cost: [L, C],
      damage: 40,
      text: 'During your opponent\'s next turn, prevent all damage done to each of your Future Pokémon by attacks from Pokémon ex. If this Pokémon is no longer your Active Pokémon, this effect ends.'
    },
    {
      name: 'Thunder Claws',
      cost: [L, C, C],
      damage: 100,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '69';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Miraidon';
  public fullName: string = 'Miraidon SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      // During your opponent's next turn, prevent all damage done to each of your
      // Future Pokemon by attacks from Pokemon ex. This effect ends if this Pokemon
      // is no longer your Active Pokemon.
      state = PREVENT_DAMAGE(store, state, effect, this);
    }

    return state;
  }
}
