import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State, GameMessage, ChooseCardsPrompt } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS, MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Tropius extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 110;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Fruit Bearing',
      cost: [C],
      damage: 0,
      text: 'Discard a card from your hand. If you do, draw 3 cards.'
    },
    {
      name: 'Gust',
      cost: [C, C],
      damage: 50,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '123';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tropius';
  public fullName: string = 'Tropius JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      if (player.hand.cards.length === 0) {
        return state;
      }

      state = store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_DISCARD,
        player.hand,
        {},
        { min: 1, max: 1, allowCancel: false }
      ), cards => {
        const chosen = cards || [];
        if (chosen.length === 0) {
          return;
        }
        state = MOVE_CARDS(store, state, player.hand, player.discard, { cards: chosen });
        state = DRAW_CARDS(store, state, player, 3);
      }) ?? state;
    }

    return state;
  }
}
