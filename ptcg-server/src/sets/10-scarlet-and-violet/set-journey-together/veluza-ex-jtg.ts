import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AttackEffect } from '../../../game/store/effects/game-effects';
import {
  CONFIRMATION_PROMPT,
  MOVE_CARDS,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Veluzaex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 210;
  public weakness = [{ type: L }];
  public retreat = [C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Razor Fin',
      cost: [W],
      damage: 30,
      text: '',
    },
    {
      name: 'Purging Strike',
      cost: [W, W, C],
      damage: 120,
      damageCalculation: '+',
      text: 'You may discard your hand. If you discarded any cards in this way, this attack does 120 more damage.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '43';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Veluza ex';
  public fullName: string = 'Veluza ex JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const attackEffect: AttackEffect = effect;
      const player = attackEffect.player;

      // 手牌为空时无从弃牌，也不会追加伤害。
      if (player.hand.cards.length === 0) {
        return state;
      }

      // 「若希望」= 可选择的确认；确认后弃掉全部手牌并追加 120 伤害。
      return CONFIRMATION_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }

        const cards = player.hand.cards.slice();
        if (cards.length === 0) {
          return;
        }

        MOVE_CARDS(store, state, player.hand, player.discard, { cards });
        THIS_ATTACK_DOES_X_MORE_DAMAGE(attackEffect, store, state, 120);
      });
    }

    return state;
  }
}
