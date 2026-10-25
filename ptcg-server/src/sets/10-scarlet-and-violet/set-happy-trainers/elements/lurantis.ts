import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, EnergyType, Stage, SuperType } from '../../../../game/store/card/card-types';
import { Card } from '../../../../game/store/card/card';
import { EnergyCard } from '../../../../game/store/card/energy-card';
import { Effect } from '../../../../game/store/effects/effect';
import { State } from '../../../../game/store/state/state';
import { StoreLike } from '../../../../game/store/store-like';
import { ChooseCardsPrompt } from '../../../../game/store/prompts/choose-cards-prompt';
import { GameMessage } from '../../../../game/game-message';
import { WAS_ATTACK_USED } from '../../../../game/store/prefabs/prefabs';

function isBasicGrass(card: Card): boolean {
  return card instanceof EnergyCard && card.energyType === EnergyType.BASIC
    && card.provides.includes(CardType.GRASS);
}

export class LurantisHappy6 extends PokemonCard {
  public stage = Stage.STAGE_1;
  public evolvesFrom = 'Fomantis';
  public cardType = [CardType.GRASS];
  public hp = 120;
  public weakness = [{ type: CardType.FIRE }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public regulationMark = 'I';

  public attacks = [
    {
      name: '飞叶快刀',
      cost: [CardType.COLORLESS],
      damage: 30,
      text: ''
    },
    {
      name: '花切舞',
      cost: [CardType.GRASS],
      damage: 130,
      text: '将自己手牌中的2张「基本【草】能量」放于弃牌区。如果无法将2张放于弃牌区的话，则这个招式失败。'
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '006';
  public name = 'Lurantis';
  public fullName = 'Lurantis CSVH6eC';
  public cardImage = 'assets/cardback.png';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      if (player.hand.cards.filter(isBasicGrass).length < 2) {
        effect.damage = 0;
        return state;
      }
      const blocked = player.hand.cards.map((card, index) => isBasicGrass(card) ? -1 : index)
        .filter(index => index !== -1);
      return store.prompt(state, new ChooseCardsPrompt(
        player, GameMessage.CHOOSE_CARD_TO_DISCARD, player.hand,
        { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
        { min: 2, max: 2, allowCancel: false, blocked }
      ), cards => {
        // The generic prompt permits duplicate indexes; they cannot pay a two-card cost.
        if (!cards || new Set(cards).size !== 2 || !cards.every(isBasicGrass)) {
          effect.damage = 0;
          return;
        }
        player.hand.moveCardsTo(cards, player.discard);
      });
    }
    return state;
  }
}
