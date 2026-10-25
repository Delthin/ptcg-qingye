import { TrainerCard } from '../../../game/store/card/trainer-card';
import { CardType, TrainerType } from '../../../game/store/card/card-types';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { IS_TOOL_BLOCKED, MOVE_CARDS } from '../../../game/store/prefabs/prefabs';

export class OccaBerry extends TrainerCard {
  public trainerType = TrainerType.TOOL;

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '140';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Occa Berry';
  public fullName: string = 'Occa Berry SCR';

  public text: string =
    'If the Pokémon this card is attached to is damaged by an attack from your opponent\'s Fire Pokémon, ' +
    'it takes 60 less damage (after applying Weakness and Resistance), and discard this card.';

  private readonly DAMAGE_REDUCTION = 60;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PutDamageEffect && effect.target.tools.includes(this)) {
      const player = StateUtils.findOwner(state, effect.target);

      if (IS_TOOL_BLOCKED(store, state, player, this)) {
        return state;
      }

      const source = effect.source;

      // Only attacks from the opponent's Fire Pokemon trigger this tool
      if (!(source instanceof PokemonCard) || !source.cardType.includes(CardType.FIRE)) {
        return state;
      }

      effect.damage = Math.max(0, effect.damage - this.DAMAGE_REDUCTION);

      // The card is discarded after it reduced the damage
      state = MOVE_CARDS(store, state, effect.target, player.discard, { cards: [this] });
    }

    return state;
  }
}
