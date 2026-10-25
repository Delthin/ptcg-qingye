import { CardType, EnergyType } from '../../../game/store/card/card-types';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { StoreLike } from '../../../game/store/store-like';
import { State, GamePhase } from '../../../game/store/state/state';
import { Effect } from '../../../game/store/effects/effect';
import { StateUtils } from '../../../game';
import { AfterDamageEffect } from '../../../game/store/effects/attack-effects';
import { IS_SPECIAL_ENERGY_BLOCKED } from '../../../game/store/prefabs/prefabs';


export class LuckyEnergy extends EnergyCard {

  public provides: CardType[] = [CardType.COLORLESS];
  public energyType = EnergyType.SPECIAL;
  public regulationMark = 'E';
  public set: string = 'CRE';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '158';
  public name = 'Lucky Energy';
  public fullName = 'Lucky Energy CRE';

  public text =
    `As long as this card is attached to a Pokémon, it provides [C] Energy. 

If the Pokémon this card is attached to is in the Active Spot and is damaged by an attack from your opponent's Pokémon (even if it is Knocked Out), draw a card.`;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Managed attacks notify after their non-damage effects. An Energy removed
    // by the attack must no longer react, even though it was attached on impact.
    if (effect instanceof AfterDamageEffect && effect.target.cards.includes(this)) {
      const player = StateUtils.findOwner(state, effect.target);
      if (state.phase !== GamePhase.ATTACK || effect.damage <= 0
        || effect.target !== player.active
        || StateUtils.findOwner(state, effect.source) === player) {
        return state;
      }

      if (IS_SPECIAL_ENERGY_BLOCKED(store, state, player, this, effect.target)) {
        return state;
      }

      player.deck.moveTo(player.hand, 1);
      return state;
    }
    return state;
  }

}
