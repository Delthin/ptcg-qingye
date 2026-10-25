import { TrainerCard, TrainerType, State, StoreLike, StateUtils } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { CheckPokemonTypeEffect } from '../../../game/store/effects/check-effects';
import { IS_TOOL_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class BabiriBerry extends TrainerCard {
  public trainerType = TrainerType.TOOL;

  public regulationMark = 'H';

  public set: string = 'SSP';

  public setNumber: string = '163';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Babiri Berry';

  public fullName: string = 'Babiri Berry SSP';

  public text: string =
    'If the Pokémon this card is attached to is damaged by an attack from your opponent\'s Metal Pokémon, ' +
    'it takes 60 less damage (after applying Weakness and Resistance), and discard this card.';

  private readonly DAMAGE_REDUCTION = 60;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PutDamageEffect && effect.target.tools.includes(this)) {
      const player = StateUtils.findOwner(state, effect.target);

      if (IS_TOOL_BLOCKED(store, state, player, this)) {
        return state;
      }

      const opponent = StateUtils.getOpponent(state, player);

      // The damage must come from the opponent's Metal Pokémon.
      const checkPokemonType = new CheckPokemonTypeEffect(opponent.active);
      state = store.reduceEffect(state, checkPokemonType);

      if (!checkPokemonType.cardTypes.includes(M)) {
        return state;
      }

      // Reduce 60 damage (after Weakness and Resistance) and discard this card.
      effect.damage = Math.max(0, effect.damage - this.DAMAGE_REDUCTION);

      const index = effect.target.tools.indexOf(this);
      if (index !== -1) {
        effect.target.tools.splice(index, 1);
        player.discard.cards.push(this);
      }
    }

    return state;
  }
}
