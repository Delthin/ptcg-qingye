import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import {
  ATTACH_ENERGY_PROMPT,
  SWITCH_ACTIVE_WITH_BENCHED,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Kilowattrelex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Wattrel';
  public cardType: CardType[] = [L];
  public hp: number = 260;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Return Charge',
      cost: [L],
      damage: 0,
      text: 'Switch this Pokémon with 1 of your Benched Pokémon. If you do, attach up to 2 Basic Lightning Energy cards from your hand to this Pokémon.'
    },
    {
      name: 'Thunder Lance',
      cost: [C, C],
      damage: 40,
      damageCalculation: '+',
      text: 'This attack does 40 more damage for each Lightning Energy attached to this Pokémon.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '68';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Kilowattrel ex';
  public fullName: string = 'Kilowattrel ex SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const hasBenchedPokemon = player.bench.some(b => b.cards.length > 0);

      if (hasBenchedPokemon) {
        state = SWITCH_ACTIVE_WITH_BENCHED(store, state, player) ?? state;

        state = ATTACH_ENERGY_PROMPT(
          store,
          state,
          player,
          PlayerType.BOTTOM_PLAYER,
          SlotType.HAND,
          [SlotType.ACTIVE, SlotType.BENCH],
          { name: 'Lightning Energy' },
          { min: 0, max: 2 });
      }
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, effect.target);
      state = store.reduceEffect(state, checkProvidedEnergy);

      let lightningEnergy = 0;
      checkProvidedEnergy.energyMap.forEach(energy => {
        if (energy.provides.includes(CardType.LIGHTNING)) {
          lightningEnergy++;
        }
      });

      THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 40 * lightningEnergy);
    }

    return state;
  }
}
