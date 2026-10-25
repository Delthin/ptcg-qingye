import { TrainerCard, TrainerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { DEAL_DAMAGE, IS_TOOL_BLOCKED, MOVE_CARDS } from '../../../game/store/prefabs/prefabs';

export class PayapaBerry extends TrainerCard {
  public trainerType = TrainerType.TOOL;

  public regulationMark = 'H';

  public set: string = 'SCR';

  public setNumber: string = '141';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Payapa Berry';

  public fullName: string = 'Payapa Berry SCR';

  public text: string =
    'If the Pokémon this card is attached to is damaged by an attack from your opponent\'s Psychic Pokémon, it takes 60 less damage (after applying Weakness and Resistance), and discard this card.\n' +
    'You may attach any number of Pokémon Tools to your Pokémon during your turn. You may attach only 1 Pokémon Tool to each Pokémon, and it stays attached.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Only damage being dealt to a Pokémon matters for this card.
    if (!(DEAL_DAMAGE(effect) || effect instanceof PutDamageEffect)) {
      return state;
    }

    const target = effect.target;
    if (!target || !target.tools.includes(this)) {
      return state;
    }

    // Find the player who controls the Pokémon this card is attached to.
    const owner = state.players.find(p => p.active === target || p.bench.includes(target));
    if (owner === undefined) {
      return state;
    }

    const opponent = state.players.find(p => p !== owner);
    const attacker = opponent?.active.getPokemonCard();
    if (attacker === undefined) {
      return state;
    }

    if (IS_TOOL_BLOCKED(store, state, owner, this)) {
      return state;
    }

    // Only attacks from the opponent's Psychic Pokémon are reduced.
    if (!attacker.cardType.includes(P)) {
      return state;
    }

    effect.damage = Math.max(0, effect.damage - 60);

    state = MOVE_CARDS(store, state, target, owner.discard, { cards: [this] });

    return state;
  }
}
