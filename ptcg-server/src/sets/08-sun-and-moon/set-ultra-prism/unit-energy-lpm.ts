import { CardType, EnergyType } from '../../../game/store/card/card-types';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { Effect } from '../../../game/store/effects/effect';
import { EnergyEffect } from '../../../game/store/effects/play-card-effects';
import { State } from '../../../game/store/state/state';
import { StoreLike } from '../../../game/store/store-like';

export class UnitEnergyLPM extends EnergyCard {
  public provides: CardType[] = [CardType.COLORLESS];
  public energyType = EnergyType.SPECIAL;
  public set: string = 'UPR';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '138';
  public name = 'Unit Energy LPM';
  public fullName = 'Unit Energy LPM UPR';

  public text =
    'This card provides [C] Energy.\n\n' +
    'While this card is attached to a Pokémon, it provides [L], [P], and [M] Energy but provides only 1 Energy at a time.';

  public blendedEnergies = [CardType.LIGHTNING, CardType.PSYCHIC, CardType.METAL];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckProvidedEnergyEffect && effect.source.cards.includes(this)) {
      let blocked = false;
      try {
        const energyEffect = new EnergyEffect(effect.player, this);
        store.reduceEffect(state, energyEffect);
        blocked = energyEffect.preventDefault;
      } catch {
        blocked = true;
      }

      // One independent unit per card, with alternatives bound to this map.
      // A blocked effect must not fall back to the printed blended alternatives.
      const provides = [CardType.COLORLESS];
      effect.energyMap.push({
        card: this,
        provides,
        providesOptions: blocked ? null : {
          provides: [...provides],
          units: [[...this.blendedEnergies]],
        },
      });
    }
    return state;
  }
}
