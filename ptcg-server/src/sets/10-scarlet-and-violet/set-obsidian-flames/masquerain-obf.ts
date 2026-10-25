import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { FLIP_UNTIL_TAILS_AND_COUNT_HEADS, MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Masquerain extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Surskit';
  public cardType: CardType[] = [G];
  public hp: number = 100;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Panic-Prompting Pattern',
      cost: [C],
      damage: 0,
      text: 'Flip a coin until you get tails. For each heads, discard a random card from your opponent\'s hand.'
    },
    {
      name: 'Bug Buzz',
      cost: [G, C],
      damage: 70,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '7';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Masquerain';
  public fullName: string = 'Masquerain OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      return FLIP_UNTIL_TAILS_AND_COUNT_HEADS(store, state, player, heads => {
        const handCards = opponent.hand.cards;
        const count = Math.min(heads, handCards.length);
        if (count <= 0) {
          return;
        }

        const available = handCards.map((_, index) => index);
        const selected: typeof handCards = [];

        for (let i = 0; i < count; i++) {
          const pick = Math.floor(Math.random() * available.length);
          selected.push(handCards[available[pick]]);
          available.splice(pick, 1);
        }

        MOVE_CARDS(store, state, opponent.hand, opponent.discard, { cards: selected });
      });
    }
    return state;
  }
}
