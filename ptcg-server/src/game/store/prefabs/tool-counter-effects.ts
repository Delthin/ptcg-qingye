import { CardTag } from '../card/card-types';
import { TrainerCard } from '../card/trainer-card';
import { CheckHpEffect, CheckPokemonTypeEffect } from '../effects/check-effects';
import { AfterDamageEffect } from '../effects/attack-effects';
import { KnockOutEffect } from '../effects/game-effects';
import { CardType } from '../card/card-types';
import { GamePhase, State } from '../state/state';
import { Player } from '../state/player';
import { PokemonCardList } from '../state/pokemon-card-list';
import { StateUtils } from '../state-utils';
import { StoreLike } from '../store-like';
import { IS_TOOL_BLOCKED } from './prefabs';

export interface ToolKnockOutReceipt {
  turn: number;
  holderId: number;
  attackerId: number;
}

/** Records lethal applied attack damage, not a prediction made before damage prevention. */
export function captureToolKnockOut(
  store: StoreLike, state: State, effect: AfterDamageEffect,
  kind: 'any' | 'psychic' | 'full-hp-v',
): ToolKnockOutReceipt | undefined {
  const holder = effect.target.getPokemonCard();
  const attacker = effect.source.getPokemonCard();
  if (!holder || !attacker || effect.damage <= 0 || state.phase !== GamePhase.ATTACK) return undefined;
  const owner = StateUtils.findOwner(state, effect.target);
  if (owner === effect.player) return undefined;
  const hp = new CheckHpEffect(owner, effect.target);
  store.reduceEffect(state, hp);
  if (effect.target.damage < hp.hp) return undefined;
  if (kind === 'full-hp-v') {
    const isV = [CardTag.POKEMON_V, CardTag.POKEMON_VMAX, CardTag.POKEMON_VSTAR, CardTag.POKEMON_VUNION].some(tag => holder.hasTag(tag));
    if (!isV || effect.target.damage !== effect.damage) return undefined;
  }
  if (kind === 'psychic') {
    const types = new CheckPokemonTypeEffect(effect.target);
    store.reduceEffect(state, types);
    if (!types.cardTypes.includes(CardType.PSYCHIC)) return undefined;
  }
  return { turn: state.turn, holderId: holder.id, attackerId: attacker.id };
}

/** The local callback runs after this KO actually discards its holder; cancelled KOs do not run it. */
export function reactToToolKnockOut(
  store: StoreLike, state: State, effect: KnockOutEffect, tool: TrainerCard,
  receipt: ToolKnockOutReceipt | undefined,
  reaction: (state: State, owner: Player, attacker: PokemonCardList | undefined) => State,
): State {
  if (!receipt || receipt.turn !== state.turn || state.phase !== GamePhase.ATTACK
    || effect.target.getPokemonCard()?.id !== receipt.holderId || !effect.target.tools.includes(tool)
    || IS_TOOL_BLOCKED(store, state, effect.player, tool)) return state;
  effect.onKnockedOut.push(next => {
    const attacker = next.players.reduce<PokemonCardList[]>((all, player) => all.concat(player.getPokemonInPlay()), [])
      .find(list => list.getPokemonCard()?.id === receipt.attackerId);
    return reaction(next, effect.player, attacker);
  });
  return state;
}
