import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { WAS_ATTACK_USED, SWITCH_IN_OPPONENT_BENCHED_POKEMON } from '../../../game/store/prefabs/prefabs';

export class Zangoose extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 110;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Drag Off',
      cost: [C, C],
      damage: 0,
      text: 'Switch in 1 of your opponent\'s Benched Pokémon to the Active Spot. This attack does 30 damage to the new Active Pokémon.',
    },
    {
      name: 'Slashing Claw',
      cost: [C, C, C],
      damage: 80,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '147';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Zangoose';
  public fullName: string = 'Zangoose SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;
      const benched = opponent.bench.filter(b => b.cards.length > 0);

      // 对手没有备战宝可梦时，此招式不造成任何伤害
      if (benched.length === 0) {
        return state;
      }

      state = SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, effect.player);

      const damageEffect = new PutDamageEffect(effect, 30);
      damageEffect.target = opponent.active;
      store.reduceEffect(state, damageEffect);
    }

    return state;
  }
}
