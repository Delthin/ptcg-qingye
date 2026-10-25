import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  DEAL_DAMAGE,
  HEAL_X_DAMAGE_FROM_THIS_POKEMON,
  IS_ABILITY_BLOCKED,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

// Resolves the Pokemon behind a damage source, which may either be the Pokemon
// card itself or the PokemonCardList it is sitting in. Everything is treated as
// `unknown` first so no null-unsafe narrowing is required.
const getPokemonFromSource = (source: unknown): PokemonCard | undefined => {
  if (source instanceof PokemonCard) {
    return source;
  }

  if (source === null || typeof source !== 'object') {
    return undefined;
  }

  const container = source as { getPokemonCard?: () => PokemonCard | undefined };

  if (typeof container.getPokemonCard !== 'function') {
    return undefined;
  }

  return container.getPokemonCard() ?? undefined;
};

export class Kabutops extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Kabuto';
  public cardType: CardType[] = [F];
  public hp: number = 160;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public powers = [{
    name: 'Ancient Way',
    powerType: PowerType.ABILITY,
    text: 'Apply Weakness for your opponent\'s Active Pokémon as ×4 instead.',
  }];

  public attacks = [{
    name: 'Draining Blade',
    cost: [F, C, C],
    damage: 100,
    text: 'Heal 30 damage from this Pokémon.',
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '141';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Kabutops';
  public fullName: string = 'Kabutops MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      HEAL_X_DAMAGE_FROM_THIS_POKEMON(effect, store, state, 30);
    }

    // Ancient Way: Weakness on the opponent's Active Pokemon is applied as x4.
    if (DEAL_DAMAGE(effect)) {
      const target = effect.target;

      if (!target) {
        return state;
      }

      const targetCard = target.getPokemonCard();

      if (!targetCard) {
        return state;
      }

      const owner = state.players.find(player =>
        player.active.getPokemonCard() === this
        || player.bench.some(slot => slot.getPokemonCard() === this));

      if (!owner) {
        return state;
      }

      const defender = state.players.find(player => player !== owner);

      // Only the opponent's Active Pokemon is affected, never a Benched one.
      if (!defender || defender.active !== target) {
        return state;
      }

      if (IS_ABILITY_BLOCKED(store, state, owner, this)) {
        return state;
      }

      const source: unknown = (effect as unknown as { source?: unknown }).source;
      const attacker = getPokemonFromSource(source);

      if (!attacker) {
        return state;
      }

      const attackerIsOwnersPokemon = owner.active.getPokemonCard() === attacker
        || owner.bench.some(slot => slot.getPokemonCard() === attacker);

      if (!attackerIsOwnersPokemon) {
        return state;
      }

      const weaknessApplies = targetCard.weakness
        .some(weakness => attacker.cardType.includes(weakness.type));

      if (!weaknessApplies) {
        return state;
      }

      // The engine already applies Weakness as x2, so doubling the damage
      // makes it count as x4.
      effect.damage = effect.damage * 2;
    }

    return state;
  }
}
