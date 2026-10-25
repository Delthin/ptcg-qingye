import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { Card } from '../../../game/store/card/card';
import {
  MOVE_CARDS,
  SHUFFLE_DECK,
  SHOW_CARDS_TO_PLAYER,
  THIS_POKEMON_DOES_DAMAGE_TO_ITSELF,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Toxtricity extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Toxel';
  public cardType: CardType[] = [L];
  public hp: number = 130;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Yank Away',
      cost: [C, C],
      damage: 0,
      text: 'Choose 2 random cards from your opponent\'s hand. Your opponent reveals those cards and shuffles them into their deck.',
    },
    {
      name: 'Thunder',
      cost: [L, C, C],
      damage: 120,
      text: 'This Pokémon also does 20 damage to itself.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '72';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Toxtricity';
  public fullName: string = 'Toxtricity SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      const hand = opponent.hand.cards.slice();
      const count = Math.min(2, hand.length);

      if (count > 0) {
        const chosen: Card[] = [];
        for (let i = 0; i < count; i++) {
          const index = Math.floor(Math.random() * hand.length);
          chosen.push(hand.splice(index, 1)[0]);
        }

        state = SHOW_CARDS_TO_PLAYER(store, state, player, chosen);
        state = MOVE_CARDS(store, state, opponent.hand, opponent.deck, { cards: chosen });
        state = SHUFFLE_DECK(store, state, opponent);
      }
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 20);
    }

    return state;
  }
}
