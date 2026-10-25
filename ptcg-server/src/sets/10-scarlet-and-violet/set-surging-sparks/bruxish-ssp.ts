import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AfterDamageEffect, PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';

// PutDamageEffect 的来源参数需要攻击效果，而本特性由 AfterDamageEffect 触发（两者是同级类），
// 这里直接取它构造器的第一个参数类型，避免额外引入 AttackEffect。
type DamageSource = ConstructorParameters<typeof PutDamageEffect>[0];

export class Bruxish extends PokemonCard {

  public stage: Stage = Stage.BASIC;

  public cardType: CardType[] = [W];

  public hp: number = 110;

  public weakness = [{ type: L }];

  public retreat = [C];

  public powers = [{
    name: 'Counterattack',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon is in the Active Spot and is damaged by an attack from your opponent\'s Pokémon (even if this Pokémon is Knocked Out), put 3 damage counters on the Attacking Pokémon.',
  }];

  public attacks = [{
    name: 'Big Bite',
    cost: [W, C],
    damage: 50,
    text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.',
  }];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '49';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Bruxish';
  public fullName: string = 'Bruxish SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Big Bite: the Defending Pokémon can't retreat during your opponent's next turn.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = BLOCK_RETREAT(store, state, effect, this);
    }

    // Counterattack: 3 damage counters on the Attacking Pokémon.
    if (effect instanceof AfterDamageEffect && effect.target.cards.includes(this)) {
      const damaged = effect.target;
      const owner = state.players.find(player => player.active === damaged);

      if (owner === undefined) {
        return state;
      }

      if (IS_ABILITY_BLOCKED(store, state, owner, this)) {
        return state;
      }

      const opponent = state.players.find(player => player !== owner);

      if (opponent === undefined || opponent.active.getPokemonCard() === undefined) {
        return state;
      }

      const damageEffect = new PutDamageEffect(effect as unknown as DamageSource, 30);
      damageEffect.target = opponent.active;
      state = store.reduceEffect(state, damageEffect);
    }

    return state;
  }
}
