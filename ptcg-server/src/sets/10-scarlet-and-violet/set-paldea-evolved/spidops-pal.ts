import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  MOVE_CARDS,
  SHUFFLE_DECK,
  SWITCH_ACTIVE_WITH_BENCHED,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Spidops extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Tarountula';
  public cardType: CardType[] = [G];
  public hp: number = 110;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Entangling Trap',
      cost: [G, G],
      damage: 0,
      text: 'Shuffle each player\'s Active Pokémon and all attached cards into their deck. (You choose a new Active Pokémon first.)'
    },
    {
      name: 'Hammer In',
      cost: [G, G, G],
      damage: 130,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '18';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Spidops';
  public fullName: string = 'Spidops PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      // Shuffle each player's Active Pokemon and all attached cards into their deck.
      if (player.active.cards.length > 0) {
        state = MOVE_CARDS(store, state, player.active, player.deck, {
          cards: player.active.cards.slice()
        });
        state = SHUFFLE_DECK(store, state, player);
      }

      if (opponent.active.cards.length > 0) {
        state = MOVE_CARDS(store, state, opponent.active, opponent.deck, {
          cards: opponent.active.cards.slice()
        });
        state = SHUFFLE_DECK(store, state, opponent);
      }

      // You choose a new Active Pokemon first, then your opponent chooses theirs.
      state = SWITCH_ACTIVE_WITH_BENCHED(store, state, player) ?? state;
      state = SWITCH_ACTIVE_WITH_BENCHED(store, state, opponent) ?? state;
    }

    return state;
  }
}
