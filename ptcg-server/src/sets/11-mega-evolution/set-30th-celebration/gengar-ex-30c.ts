import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardTag, CardType, Stage } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AfterDamageEffect, PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { CheckHpEffect } from '../../../game/store/effects/check-effects';
import { COIN_FLIP_PROMPT, IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { PUT_X_DAMAGE_COUNTERS_IN_ANY_WAY_YOU_LIKE } from '../../../game/store/prefabs/attack-effects';

// PutDamageEffect takes an AttackEffect as its damage source. Fainting Spell resolves from an
// AfterDamageEffect (the opponent's attack just Knocked this Pokemon Out), so there is no attack
// effect of our own to hand over: borrow the source type from the engine's own PutDamageEffect
// signature instead of re-declaring it here.
type DamageSource = ConstructorParameters<typeof PutDamageEffect>[0];

export class Gengarex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 280;
  public weakness = [{ type: F }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public powers = [{
    name: 'Fainting Spell',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon is Knocked Out by damage from an attack from your opponent\'s Pokémon, flip a coin. If heads, the Attacking Pokémon is Knocked Out.',
  }];

  public attacks = [{
    name: 'Chaotic Pain',
    cost: [D, D],
    damage: 0,
    text: 'Place 13 damage counters on 1 of your opponent\'s Pokémon.',
  }];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '90';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Gengar ex';
  public fullName: string = 'Gengar ex 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      PUT_X_DAMAGE_COUNTERS_IN_ANY_WAY_YOU_LIKE(13, store, state, effect);
    }

    if (effect instanceof AfterDamageEffect) {
      const target = effect.target;

      if (target.getPokemonCard() !== this) {
        return state;
      }

      const player = StateUtils.findOwner(state, target);

      // Fainting Spell is an Ability, so ability-locking effects switch it off.
      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      // Fainting Spell only triggers if the damage of the attack Knocks this Pokémon Out.
      const checkHp = new CheckHpEffect(player, target);
      state = store.reduceEffect(state, checkHp);

      if (target.damage < checkHp.hp) {
        return state;
      }

      const attackingPlayer = StateUtils.getOpponent(state, player);
      const attackingPokemon = attackingPlayer.active;

      if (attackingPokemon.cards.length === 0) {
        return state;
      }

      const checkAttackingHp = new CheckHpEffect(attackingPlayer, attackingPokemon);
      state = store.reduceEffect(state, checkAttackingHp);

      if (attackingPokemon.damage >= checkAttackingHp.hp) {
        return state;
      }

      // Damage equal to what is left of the Attacking Pokemon Knocks it Out.
      const knockOutDamage = checkAttackingHp.hp - attackingPokemon.damage;
      const damageSource = effect as unknown as DamageSource;

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }

        // The Attacking Pokémon is Knocked Out (its opponent takes the Prize cards).
        const knockOutEffect = new PutDamageEffect(damageSource, knockOutDamage);
        knockOutEffect.target = attackingPokemon;
        store.reduceEffect(state, knockOutEffect);
      });
    }

    return state;
  }
}
