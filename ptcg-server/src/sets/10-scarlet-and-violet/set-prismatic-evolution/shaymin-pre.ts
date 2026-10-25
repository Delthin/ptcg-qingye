import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { ATTACH_ENERGY_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Shaymin extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 70;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [{
    name: 'Reflect Energy',
    cost: [C, C],
    damage: 60,
    text: 'Move an Energy from this Pokémon to 1 of your Benched Pokémon.'
  }];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '87';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Shaymin';
  public fullName: string = 'Shaymin PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // Nothing to move if there is no Benched Pokémon.
      const hasBench = player.bench.some(b => b.cards.length > 0);
      if (!hasBench) {
        return state;
      }

      // Nothing to move if this Pokémon has no Energy attached.
      const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, player.active);
      state = store.reduceEffect(state, checkProvidedEnergy);

      if (checkProvidedEnergy.energyMap.length === 0) {
        return state;
      }

      // Move 1 Energy from this Pokémon (Active) to 1 of the Benched Pokémon.
      return ATTACH_ENERGY_PROMPT(
        store,
        state,
        player,
        PlayerType.BOTTOM_PLAYER,
        SlotType.ACTIVE,
        [SlotType.BENCH]
      );
    }

    return state;
  }
}
