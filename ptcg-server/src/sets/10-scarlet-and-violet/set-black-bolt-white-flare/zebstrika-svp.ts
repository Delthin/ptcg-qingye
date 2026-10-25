import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS, MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Zebstrika extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Blitzle';
  public cardType: CardType[] = [L];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Full Speed',
      cost: [C],
      damage: 0,
      text: 'Discard your hand and draw 6 cards.',
    },
    {
      name: 'Head Bolt',
      cost: [L, C],
      damage: 70,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '201';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Zebstrika';
  public fullName: string = 'Zebstrika SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const cardsInHand = player.hand.cards.slice();
      if (cardsInHand.length > 0) {
        state = MOVE_CARDS(store, state, player.hand, player.discard, { cards: cardsInHand });
      }

      state = DRAW_CARDS(store, state, player, 6);
    }

    return state;
  }
}
