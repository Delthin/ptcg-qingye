import { GameError } from '../../game-error';
import { GameMessage } from '../../game-message';
import { PowerType } from '../card/pokemon-types';
import { PokemonCard } from '../card/pokemon-card';
import { Card } from '../card/card';
import { EnergyCard } from '../card/energy-card';
import { CardList } from '../state/card-list';
import { AttachEnergyEffect } from '../effects/play-card-effects';
import { StateUtils } from '../state-utils';
import { IS_ABILITY_BLOCKED } from './prefabs';
import { Effect } from '../effects/effect';
import { AbstractAttackEffect, PutCountersEffect } from '../effects/attack-effects';
import { shouldPreventAttackEffects } from '../effects/effect-of-attack-effects';
import { AttackEffect, EffectOfAbilityEffect, MoveDamageCountersEffect, PlaceDamageCountersEffect, PowerEffect, PutDamageCountersEffect } from '../effects/game-effects';
import { PokemonCardList } from '../state/pokemon-card-list';
import { Player } from '../state/player';
import { State } from '../state/state';
import { StoreLike } from '../store-like';
import { isDamageStep } from '../prompts/damage-prompt-validation';

class DamageCounterSourceEffect extends AbstractAttackEffect implements Effect {
  readonly type = 'CHECK_DAMAGE_COUNTER_SOURCE_EFFECT';
  constructor(base: AttackEffect | AbstractAttackEffect, target: PokemonCardList) {
    super(base);
    this.target = target;
  }
}

/** Applies an Ability's counters through both Ability protection and counter-placement prevention. */
export function putAbilityDamageCounters(
  store: StoreLike, state: State, base: PowerEffect, target: PokemonCardList, damage: number,
  onPlaced?: () => void,
): State {
  if (damage === 0) return state;
  if (!isDamageStep(damage)) throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
  const targeted = new PowerEffect(base.player, base.power, base.card, target);
  const counters = new PutDamageCountersEffect(targeted, damage);
  state = store.reduceEffect(state, counters);
  if (counters.appliedDamage > 0 && onPlaced) onPlaced();
  return state;
}

/** Attachment-linked counters are applied only after the energy physically reaches its target. */
export function attachEnergyWithDamageCounters(
  store: StoreLike, state: State, player: Player, card: Card,
  target: PokemonCardList, source: CardList, damage: number,
): State {
  if (!(card instanceof EnergyCard) || (damage !== 0 && !isDamageStep(damage))) {
    throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
  }
  const attachment = new AttachEnergyEffect(player, card, target, source);
  if (damage > 0) attachment.onAttached.push(() => { target.damage += damage; });
  return store.reduceEffect(state, attachment);
}

/** Uses the physical source owner, including passive powers triggered by an opponent's action. */
export function putPokemonPowerDamageCounters(
  store: StoreLike, state: State, card: PokemonCard, target: PokemonCardList, damage: number,
  onPlaced?: () => void,
): State {
  const owner = StateUtils.findOwner(state, StateUtils.findCardList(state, card));
  const power = card.powers.find(candidate => candidate.powerType !== PowerType.TRAINER_ABILITY);
  if (!power) throw new GameError(GameMessage.CANNOT_USE_POWER);
  if (IS_ABILITY_BLOCKED(store, state, owner, card, power)) return state;
  const base = new PowerEffect(owner, power, card, target);
  if (base.power.powerType === PowerType.ABILITY) {
    return putAbilityDamageCounters(store, state, base, target, damage, onPlaced);
  }
  if (damage === 0) return state;
  if (!isDamageStep(damage)) throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
  const placement = new PlaceDamageCountersEffect(owner, target, damage, card);
  placement.origin = 'legacy-power';
  placement.effectName = base.power.name;
  state = store.reduceEffect(state, placement);
  if (placement.appliedDamage > 0 && onPlaced) onPlaced();
  return state;
}

/** A global move prohibition stops removal; prevention on the recipient only stops placement. */
export function moveDamageCounters(
  store: StoreLike, state: State, player: Player,
  source: PokemonCardList, target: PokemonCardList, damage: number,
  origin?: PowerEffect | AttackEffect | AbstractAttackEffect,
): State {
  if (damage === 0) return state;
  if (!isDamageStep(damage)) throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
  if (source === target || source.damage < damage
    || !source.getPokemonCard() || !target.getPokemonCard()) return state;
  const causalPlayer = origin ? origin.player : player;
  const moveCheck = new MoveDamageCountersEffect(causalPlayer);
  state = store.reduceEffect(state, moveCheck);
  if (moveCheck.preventDefault) return state;

  if (origin instanceof PowerEffect && origin.power.powerType === PowerType.ABILITY) {
    const sourceCheck = new EffectOfAbilityEffect(origin.player, origin.power, origin.card, source);
    state = store.reduceEffect(state, sourceCheck);
    if (sourceCheck.preventDefault || !sourceCheck.target) return state;
  } else if (origin instanceof AttackEffect || origin instanceof AbstractAttackEffect) {
    const sourceCheck = new DamageCounterSourceEffect(origin, source);
    state = store.reduceEffect(state, sourceCheck);
    if (sourceCheck.preventDefault || !sourceCheck.target || shouldPreventAttackEffects(state, sourceCheck)) return state;
  }

  source.damage -= damage;
  if (origin instanceof PowerEffect && origin.power.powerType === PowerType.ABILITY) {
    return putAbilityDamageCounters(store, state, origin, target, damage);
  }
  if (origin instanceof AttackEffect || origin instanceof AbstractAttackEffect) {
    const put = new PutCountersEffect(origin, damage);
    put.target = target;
    return store.reduceEffect(state, put);
  }
  const put = new PlaceDamageCountersEffect(causalPlayer, target, damage, origin instanceof PowerEffect ? origin.card : undefined);
  put.origin = origin instanceof PowerEffect ? 'legacy-power' : 'trainer';
  return store.reduceEffect(state, put);
}

/** Snapshots both amounts so newly received counters are never spent by the reverse move. */
export function swapDamageCounters(
  store: StoreLike, state: State, origin: AttackEffect | AbstractAttackEffect,
  first: PokemonCardList, second: PokemonCardList,
): State {
  const firstDamage = first.damage;
  const secondDamage = second.damage;
  state = moveDamageCounters(store, state, origin.player, first, second, firstDamage, origin);
  return moveDamageCounters(store, state, origin.player, second, first, secondDamage, origin);
}
