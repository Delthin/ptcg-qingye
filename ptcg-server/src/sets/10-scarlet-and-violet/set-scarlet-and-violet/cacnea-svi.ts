import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { IS_ABILITY_BLOCKED, ON_DAMAGED_BY_OPPONENT_ATTACK_EVEN_IF_KNOCKED_OUT } from '../../../game/store/prefabs/prefabs';

export class Cacnea extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.GRASS];
  public hp: number = 60;
  public weakness = [{ type: CardType.FIRE }];
  public retreat = [CardType.COLORLESS];

  public powers = [{
    name: 'Counterattack Quills',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon is in the Active Spot and is damaged by an attack from your opponent\'s Pokémon (even if this Pokémon is Knocked Out), put 3 damage counters on the Attacking Pokémon.',
  }];

  public attacks = [{
    name: 'Light Punch',
    cost: [CardType.COLORLESS, CardType.COLORLESS],
    damage: 30,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '5';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Cacnea';
  public fullName: string = 'Cacnea SVI';

  private readonly COUNTER_DAMAGE = 3 * 10;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Counterattack Quills: this Pokémon must be in the Active Spot and be damaged by an
    // attack from the opponent's Pokémon (the trigger also fires when that damage Knocks
    // this Pokémon Out).
    if (ON_DAMAGED_BY_OPPONENT_ATTACK_EVEN_IF_KNOCKED_OUT(state, effect, { source: this })) {
      const player = StateUtils.findOwner(state, effect.target);

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      // This Pokémon was in the Active Spot, so the Attacking Pokémon is the opponent's
      // Active Pokémon.
      const opponent = StateUtils.getOpponent(state, player);
      if (opponent.active.cards.length === 0) {
        return state;
      }

      // The after-damage event carries the player/target/source information the damage
      // effect needs, but its type (AfterDamageEffect) is not the AttackEffect the
      // PutDamageEffect constructor is declared with, so narrow it to the constructor's
      // own parameter type.
      const damageSource = effect as unknown as ConstructorParameters<typeof PutDamageEffect>[0];
      const damageEffect = new PutDamageEffect(damageSource, this.COUNTER_DAMAGE);
      damageEffect.target = opponent.active;
      state = store.reduceEffect(state, damageEffect);
    }

    return state;
  }
}
