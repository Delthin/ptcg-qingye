import { TrainerCard } from '../../../game/store/card/trainer-card';
import { CardType, TrainerType } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { DEAL_DAMAGE, IS_ATTACK_EFFECT_FROM_OPPONENTS_POKEMON, IS_TOOL_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class PasshoBerry extends TrainerCard {
  public trainerType = TrainerType.TOOL;

  public regulationMark = 'H';

  public set: string = 'SSP';

  public setNumber: string = '184';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Passho Berry';

  public fullName: string = 'Passho Berry SSP';

  public text: string =
    'If the Pokémon this card is attached to is damaged by an attack from your opponent\'s Water Pokémon, it takes 60 less damage (after applying Weakness and Resistance), and discard this card.';

  private readonly DAMAGE_REDUCTION = 60;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Damage from attacks is dealt through DealDamageEffect; damage an attack
    // does to a Benched Pokémon is dealt through PutDamageEffect.
    if (!DEAL_DAMAGE(effect) && !(effect instanceof PutDamageEffect)) {
      return state;
    }

    // This card has to be attached to the Pokémon that is being damaged.
    if (!effect.target.tools.includes(this)) {
      return state;
    }

    const player = StateUtils.findOwner(state, effect.target);

    if (IS_TOOL_BLOCKED(store, state, player, this)) {
      return state;
    }

    // Only damage from the opponent's Pokémon is reduced.
    if (!IS_ATTACK_EFFECT_FROM_OPPONENTS_POKEMON(state, effect)) {
      return state;
    }

    const opponent = StateUtils.getOpponent(state, player);
    const attackingPokemon = opponent.active.getPokemonCard();

    if (attackingPokemon === undefined || !attackingPokemon.cardType.includes(CardType.WATER)) {
      return state;
    }

    effect.damage = Math.max(0, effect.damage - this.DAMAGE_REDUCTION);

    // After reducing the damage this card is discarded.
    const toolIndex = effect.target.tools.indexOf(this);
    if (toolIndex !== -1) {
      effect.target.tools.splice(toolIndex, 1);
      player.discard.cards.push(this);
    }

    return state;
  }
}
