import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Bewear extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Stufful';
  public cardType: CardType[] = [C];
  public hp: number = 130;
  public weakness = [{ type: F }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Power Charger',
      cost: [C],
      damage: 30,
      text: 'Search your deck for a Basic Energy card and attach it to this Pokémon. Then, shuffle your deck.',
    },
    {
      name: 'Hammer In',
      cost: [C, C, C],
      damage: 130,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SFA';
  public setNumber: string = '53';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Bewear';
  public fullName: string = 'Bewear SFA';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // Nothing to search if the deck is empty; the attack still deals its damage.
      if (player.deck.cards.length === 0) {
        return state;
      }

      state = ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(store, state, player, 1, 1);
    }
    return state;
  }
}
