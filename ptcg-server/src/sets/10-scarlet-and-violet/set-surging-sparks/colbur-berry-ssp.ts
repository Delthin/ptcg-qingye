import { TrainerCard, TrainerType, State, StoreLike, StateUtils } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { IS_TOOL_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class ColburBerry extends TrainerCard {
  public trainerType = TrainerType.TOOL;

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '168';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Colbur Berry';
  public fullName: string = 'Colbur Berry SSP';

  public text: string =
    'If the Pokémon this card is attached to is damaged by an attack from your opponent\'s ' +
    'Darkness Pokémon, it takes 60 less damage (after applying Weakness and Resistance), ' +
    'and discard this card.';

  private readonly DAMAGE_REDUCTION = 60;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PutDamageEffect && effect.target.tools.includes(this)) {
      const target = effect.target;
      const player = StateUtils.findOwner(state, target);

      if (IS_TOOL_BLOCKED(store, state, player, this)) {
        return state;
      }

      const opponent = StateUtils.getOpponent(state, player);
      const attacker = opponent.active.getPokemonCard();

      if (attacker === undefined || !attacker.cardType.includes(D)) {
        return state;
      }

      if (effect.damage <= 0) {
        return state;
      }

      effect.damage = Math.max(0, effect.damage - this.DAMAGE_REDUCTION);

      const toolIndex = target.tools.indexOf(this);
      if (toolIndex !== -1) {
        target.tools.splice(toolIndex, 1);
      }
      player.discard.cards.push(this);
    }

    return state;
  }
}
