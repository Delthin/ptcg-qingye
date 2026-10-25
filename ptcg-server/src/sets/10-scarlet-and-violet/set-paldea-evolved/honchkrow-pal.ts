import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { GameMessage, State, StoreLike } from '../../../game';
import { Card } from '../../../game/store/card/card';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';

export class Honchkrow extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Murkrow';
  public cardType: CardType[] = [D];
  public hp: number = 130;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Flap',
      cost: [D],
      damage: 30,
      text: ''
    },
    {
      name: 'Dirty Throw',
      cost: [D, C, C],
      damage: 140,
      text: 'Discard a card from your hand. If you can\'t, this attack does nothing.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '132';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Honchkrow';
  public fullName: string = 'Honchkrow PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      // If you have no cards in your hand, you can't discard a card and this attack does nothing.
      if (player.hand.cards.length === 0) {
        effect.damage = 0;
        return state;
      }

      state = store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_DISCARD,
        player.hand,
        {},
        { min: 1, max: 1, allowCancel: false }
      ), (cards: Card[]) => {
        player.hand.moveCardsTo(cards, player.discard);
      }) ?? state;
    }

    return state;
  }
}
