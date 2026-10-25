import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  WAS_ATTACK_USED,
  SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH,
} from '../../../game/store/prefabs/prefabs';

export class Clefairy extends PokemonCard {

  public regulationMark = 'G';

  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.PSYCHIC];
  public hp: number = 60;
  public weakness = [{ type: CardType.METAL }];
  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Moon-Viewing Invitation',
      cost: [CardType.PSYCHIC],
      damage: 0,
      text: 'Search your deck for up to 3 Clefairy and put them onto your Bench. Then, shuffle your deck.',
    },
    {
      name: 'Smack',
      cost: [CardType.PSYCHIC, CardType.COLORLESS],
      damage: 20,
      text: '',
    },
  ];

  public set: string = 'MEW';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '35';
  public name: string = 'Clefairy';
  public fullName: string = 'Clefairy MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Attack 1: Moon-Viewing Invitation
    // Ref: set-chilling-reign/kirlia.ts (Mirage Step, search up to 3 named Pokemon onto Bench)
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH(store, state, player,
        { name: 'Clefairy' }, { min: 0, max: 3, allowCancel: false }
      );
    }

    // Attack 2: Smack has no printed effect.

    return state;
  }

}
