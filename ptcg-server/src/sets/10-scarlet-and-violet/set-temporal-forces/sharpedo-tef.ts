import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MOVE_CARDS, MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Sharpedo extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Carvanha';
  public cardType: CardType[] = [W];
  public hp: number = 120;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Chew Off',
      cost: [C, C],
      damage: 50,
      text: 'Flip 3 coins. For each heads, discard a random card from your opponent\'s hand.',
    },
    {
      name: 'Jet Headbutt',
      cost: [W, C, C],
      damage: 100,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '43';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Sharpedo';
  public fullName: string = 'Sharpedo TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 3, results => {
        const heads = results.filter(result => result).length;

        for (let i = 0; i < heads; i++) {
          if (opponent.hand.cards.length === 0) {
            break;
          }

          const index = Math.floor(Math.random() * opponent.hand.cards.length);
          const card = opponent.hand.cards[index];

          MOVE_CARDS(store, state, opponent.hand, opponent.discard, {
            cards: [card],
            sourceCard: this,
            sourceEffect: effect,
          });
        }
      });
    }

    return state;
  }
}
