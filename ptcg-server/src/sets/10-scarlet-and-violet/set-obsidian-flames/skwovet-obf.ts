import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Skwovet extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 60;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Nicked Nibble',
      cost: [C],
      damage: 0,
      text: 'Discard the top card of your opponent\'s deck.',
    },
    {
      name: 'Gentle Slap',
      cost: [C],
      damage: 10,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '178';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Skwovet';
  public fullName: string = 'Skwovet OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;

      if (opponent.deck.cards.length === 0) {
        return state;
      }

      const topCard = opponent.deck.cards[0];
      state = MOVE_CARDS(store, state, opponent.deck, opponent.discard, { cards: [topCard] });
    }

    return state;
  }
}
