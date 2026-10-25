import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { GameMessage, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import { DRAW_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class EiscueSP203 extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 120;
  public weakness = [{ type: M }];
  public retreat = [C, C];

  public attacks = [
    {
      name: '冰之奖励',
      cost: [W],
      damage: 0,
      text: '选择自己手牌中的1张【水】能量，放于弃牌区。然后，从自己牌库上方抽取3张卡牌。',
    },
    {
      name: '鲁莽头击',
      cost: [W, W, C],
      damage: 100,
      text: '',
    },
  ];

  public regulationMark = 'E';
  public set: string = 'SWSH';
  public setNumber: string = 'S-P 203';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Eiscue';
  public fullName: string = 'Eiscue S-P 203';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // ChooseCardsPrompt 的 blocked 是手牌下标，不是卡牌对象。
      const blocked = player.hand.cards
        .map((card, index) => ({ card, index }))
        .filter(({ card }) => !(card instanceof EnergyCard
          && (card.provides.includes(CardType.WATER) || card.provides.includes(CardType.ANY))))
        .map(({ index }) => index);

      if (blocked.length < player.hand.cards.length) {
        state = store.prompt(state, new ChooseCardsPrompt(
          player,
          GameMessage.CHOOSE_CARD_TO_DISCARD,
          player.hand,
          {},
          { min: 1, max: 1, allowCancel: false, blocked }
        ), cards => {
          const card = cards[0];
          if (card !== undefined) {
            player.hand.moveCardTo(card, player.discard);
          }
        }) ?? state;
      }

      state = DRAW_CARDS(store, state, player, 3);
    }
    return state;
  }
}
