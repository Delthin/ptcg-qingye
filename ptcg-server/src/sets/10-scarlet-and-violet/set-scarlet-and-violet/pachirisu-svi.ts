import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  PREVENT_AND_CLEAR_SPECIAL_CONDITIONS,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Pachirisu extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 70;
  public weakness = [{ type: F }];
  public retreat = [C];

  public powers = [{
    name: 'Electricity Pouches',
    powerType: PowerType.ABILITY,
    text: 'This Pokémon can\'t be Paralyzed.',
  }];

  public attacks = [{
    name: 'Everyone Discharge',
    cost: [L, C],
    damage: 10,
    damageCalculation: '+',
    text: 'This attack does 20 more damage for each of your Benched [L] Pokémon. This attack\'s damage isn\'t affected by Weakness.',
  }];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '68';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pachirisu';
  public fullName: string = 'Pachirisu SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Ability: Electricity Pouches — this Pokémon can't be Paralyzed.
    // The helper's options type is not re-exported, so its parameter type is read back
    // through Parameters<typeof …>[2] instead of guessing extra field names.
    const conditionOptions =
      { source: this } as unknown as Parameters<typeof PREVENT_AND_CLEAR_SPECIAL_CONDITIONS>[2];
    PREVENT_AND_CLEAR_SPECIAL_CONDITIONS(state, effect, conditionOptions);

    // Attack: Everyone Discharge — 20 more damage per Benched [L] Pokémon, ignores Weakness.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const benchedLightning = player.bench.filter(benchSlot => {
        const pokemon = benchSlot.getPokemonCard();
        return pokemon !== undefined && pokemon.cardType.includes(CardType.LIGHTNING);
      });

      THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 20 * benchedLightning.length);
      effect.ignoreWeakness = true;
    }

    return state;
  }
}
