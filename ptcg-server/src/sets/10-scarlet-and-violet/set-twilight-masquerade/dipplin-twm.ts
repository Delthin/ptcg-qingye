import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { SWITCH_IN_OPPONENT_BENCHED_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class DipplinTWM extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Applin';
  public cardType: CardType[] = [N];
  public hp: number = 80;
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Syrup Catcher',
      cost: [G, R],
      damage: 0,
      text: 'Switch in 1 of your opponent\'s Benched Pokémon to the Active Spot. This attack does 70 damage to the new Active Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '127';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Dipplin';
  public fullName: string = 'Dipplin TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      // 对手没有备战宝可梦时不会发生互换，也就没有“新出场的宝可梦”。
      const hasBenched = opponent.bench.some(b => b.cards.length > 0);
      if (!hasBenched) {
        return state;
      }

      // 由攻击方选择对手的 1 只备战宝可梦换到战斗场。
      state = SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, player);

      // 互换完成后，对新的战斗宝可梦造成 70 伤害。
      const newActive = opponent.active;
      if (newActive.cards.length > 0) {
        const damageEffect = new PutDamageEffect(effect, 70);
        damageEffect.target = newActive;
        state = store.reduceEffect(state, damageEffect);
      }
    }

    return state;
  }
}
