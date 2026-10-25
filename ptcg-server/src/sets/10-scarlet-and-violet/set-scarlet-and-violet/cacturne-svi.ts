import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AfterDamageEffect, PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class Cacturne extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Cacnea';
  public cardType: CardType[] = [G];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public powers = [{
    name: 'Counterattack Quills',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon is in the Active Spot and is damaged by an attack from your opponent\'s Pokémon (even if this Pokémon is Knocked Out), put 3 damage counters on the Attacking Pokémon.',
  }];

  public attacks = [{
    name: 'Spike Shot',
    cost: [C, C, C],
    damage: 110,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '6';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Cacturne';
  public fullName: string = 'Cacturne SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Counterattack Quills: fires after an opponent's attack has damaged this Pokémon
    // (also when that damage Knocked it Out, since this runs before the KO is resolved).
    if (effect instanceof AfterDamageEffect) {
      const damaged = effect.target;

      // Only when this Pokémon is the one that was damaged.
      if (!damaged || damaged.getPokemonCard() !== this) {
        return state;
      }

      const player = StateUtils.findOwner(state, damaged);
      const opponent = StateUtils.getOpponent(state, player);

      // Only while this Pokémon is in the Active Spot.
      if (player.active.getPokemonCard() !== this) {
        return state;
      }

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      // The Attacking Pokémon is the opponent's Active Pokémon.
      if (opponent.active.cards.length === 0) {
        return state;
      }

      // Put 3 damage counters (= 30 damage) on the Attacking Pokémon.
      // PutDamageEffect's first parameter is typed as the AttackEffect that caused the
      // damage, which an AfterDamageEffect is not, so the handle is passed through the
      // parameter type here (it is only used by the engine as the damage's origin).
      const damageEffect = new PutDamageEffect(effect as never, 30);
      damageEffect.target = opponent.active;
      return store.reduceEffect(state, damageEffect);
    }

    return state;
  }
}
