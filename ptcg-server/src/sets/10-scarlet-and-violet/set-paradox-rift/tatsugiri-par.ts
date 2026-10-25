import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  CONFIRMATION_PROMPT,
  SEARCH_DECK_FOR_CARDS_TO_HAND,
  SWITCH_ACTIVE_WITH_BENCHED,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Tatsugiri extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [N];
  public hp: number = 70;
  public retreat = [C];

  public attacks = [
    {
      name: 'Water Gun',
      cost: [W],
      damage: 20,
      text: '',
    },
    {
      name: 'Survival Strategy',
      cost: [C, C],
      damage: 0,
      text: 'Search your deck for up to 2 cards and put them into your hand. Then, shuffle your deck. You may switch this Pokémon with 1 of your Benched Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '141';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tatsugiri';
  public fullName: string = 'Tatsugiri PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      SEARCH_DECK_FOR_CARDS_TO_HAND(store, state, player, this, {}, { min: 0, max: 2 });

      if (player.bench.some(bench => bench.cards.length > 0)) {
        state = CONFIRMATION_PROMPT(store, state, player, result => {
          if (result) {
            SWITCH_ACTIVE_WITH_BENCHED(store, state, player);
          }
        }) ?? state;
      }
    }
    return state;
  }
}
