import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, Stage, SuperType } from '../../../../game/store/card/card-types';
import { Effect } from '../../../../game/store/effects/effect';
import { DiscardCardsFromOpponentsActivePokemonEffect } from '../../../../game/store/effects/attack-effects';
import { State } from '../../../../game/store/state/state';
import { StoreLike } from '../../../../game/store/store-like';
import { ChooseCardsPrompt } from '../../../../game/store/prompts/choose-cards-prompt';
import { GameMessage } from '../../../../game/game-message';
import { WAS_ATTACK_USED, THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN } from '../../../../game/store/prefabs/prefabs';

export class FloatzelHappy6 extends PokemonCard {
  public stage = Stage.STAGE_1;
  public evolvesFrom = 'Buizel';
  public cardType = [CardType.WATER];
  public hp = 120;
  public weakness = [{ type: CardType.LIGHTNING }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public regulationMark = 'I';

  public attacks = [
    {
      name: '潮旋',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: 30,
      text: '选择对手战斗宝可梦身上附着的1个能量，放于弃牌区。'
    },
    {
      name: '水流斩',
      cost: [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS],
      damage: 140,
      text: '在下一个自己的回合，这只宝可梦无法使用招式。'
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '015';
  public name = 'Floatzel';
  public fullName = 'Floatzel CSVH6eC';
  public cardImage = 'assets/cardback.png';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      effect.afterDamageEffects.push(state => {
        const opponent = effect.opponent;
        if (!opponent.active.cards.some(card => card.superType === SuperType.ENERGY)) {
          return state;
        }
        return store.prompt(state, new ChooseCardsPrompt(
          effect.player, GameMessage.CHOOSE_ENERGY_TO_DISCARD, opponent.active,
          { superType: SuperType.ENERGY }, { min: 1, max: 1, allowCancel: false }
        ), cards => {
          if (cards && cards.length === 1) {
            store.reduceEffect(state, new DiscardCardsFromOpponentsActivePokemonEffect(effect, cards));
          }
        });
      });
    }
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN(effect.player);
    }
    return state;
  }
}
