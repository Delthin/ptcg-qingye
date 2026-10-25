import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { ATTACH_ENERGY_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_BURNED } from '../../../game/store/prefabs/attack-effects';

export class CastformSunnyForm extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 70;
  public weakness = [{ type: W }];
  public retreat = [];

  public attacks = [
    {
      name: 'Singe',
      cost: [R],
      damage: 0,
      text: 'Your opponent\'s Active Pokémon is now Burned.',
    },
    {
      name: 'Sunny Assist',
      cost: [R, C],
      damage: 50,
      text: 'Move all Energy from this Pokémon to 1 of your Benched Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '20';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Castform Sunny Form';
  public fullName: string = 'Castform Sunny Form SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Singe
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_BURNED(store, state, effect);
      return state;
    }

    // Sunny Assist
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const bench = player.bench.filter(b => b.cards.length > 0);

      // Nothing to move the Energy onto.
      if (bench.length === 0) {
        return state;
      }

      // "All Energy" means every Energy card attached to this Pokémon is moved.
      const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, player.active);
      state = store.reduceEffect(state, checkProvidedEnergy);
      const energyCount = checkProvidedEnergy.energyMap.length;

      if (energyCount === 0) {
        return state;
      }

      return ATTACH_ENERGY_PROMPT(
        store,
        state,
        player,
        PlayerType.BOTTOM_PLAYER,
        SlotType.ACTIVE,
        [SlotType.BENCH],
        {},
        { min: energyCount, max: energyCount, allowCancel: false },
      );
    }

    return state;
  }
}
