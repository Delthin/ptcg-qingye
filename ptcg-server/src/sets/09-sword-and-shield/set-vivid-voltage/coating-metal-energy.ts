import { CardType, EnergyType } from '../../../game/store/card/card-types';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { CheckPokemonStatsEffect, CheckPokemonTypeEffect, CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { StateUtils } from '../../../game/store/state-utils';
import { Effect } from '../../../game/store/effects/effect';
import { IS_SPECIAL_ENERGY_BLOCKED } from '../../../game/store/prefabs/prefabs';

import { State } from '../../../game/store/state/state';
import { StoreLike } from '../../../game/store/store-like';

export class CoatingMetalEnergy extends EnergyCard {

  public provides: CardType[] = [CardType.COLORLESS];

  public energyType = EnergyType.SPECIAL;

  public set: string = 'VIV';

  public name = 'Coating Metal Energy';

  public fullName = 'Coating Metal Energy VIV';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '163';

  public text =
    `As long as this card is attached to a Pokémon, it provides [M] Energy.
    
The [M] Pokémon this card is attached to has no Weakness.`;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (effect instanceof CheckProvidedEnergyEffect && effect.source.cards.includes(this)) {
      effect.energyMap.push({ card: this, provides: [CardType.METAL] });
      return state;
    }

    if (effect instanceof CheckPokemonStatsEffect && effect.target.cards.includes(this)) {
      const owner = StateUtils.findOwner(state, effect.target);
      if (IS_SPECIAL_ENERGY_BLOCKED(store, state, owner, this, effect.target)) {
        return state;
      }
      const checkPokemonType = new CheckPokemonTypeEffect(effect.target);
      store.reduceEffect(state, checkPokemonType);
      if (checkPokemonType.cardTypes.includes(CardType.METAL)) {
        effect.weakness = [];
      }
    }

    return state;
  }

}
