import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { PlayerType, PowerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect, CheckRetreatCostEffect } from '../../../game/store/effects/check-effects';
import { ATTACH_ENERGY_PROMPT, IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Clefableex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Clefairy';
  public cardType: CardType[] = [P];
  public hp: number = 260;
  public weakness = [{ type: M }];
  public retreat = [C, C];

  protected _tags = [CardTag.POKEMON_ex];

  public powers = [{
    name: 'Lunar Zone',
    powerType: PowerType.ABILITY,
    text: 'As long as this Pokémon is in play, all of your Pokémon that have any [P] Energy attached have no Retreat Cost.'
  }];

  public attacks = [
    {
      name: 'Lunar Miracle',
      cost: [P, P, P],
      damage: 170,
      text: 'Move any number of [P] Energy from your Pokémon to your other Pokémon in any way you like.'
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '82';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Clefable ex';
  public fullName: string = 'Clefable ex OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Lunar Zone: as long as this Pokémon is in play, your Pokémon with any [P] Energy attached have no Retreat Cost.
    if (effect instanceof CheckRetreatCostEffect) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      let isInPlay = false;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        if (cardList.getPokemonCard() === this) {
          isInPlay = true;
        }
      });

      if (!isInPlay || player.active.cards.length === 0) {
        return state;
      }

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, player.active);
      state = store.reduceEffect(state, checkProvidedEnergy);

      const hasPsychicEnergy = checkProvidedEnergy.energyMap
        .some(energy => energy.provides.includes(CardType.PSYCHIC));

      if (hasPsychicEnergy) {
        effect.cost = [];
      }
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // Move any number of [P] Energy from your Pokémon to your other Pokémon in any way you like.
      return ATTACH_ENERGY_PROMPT(
        store,
        state,
        player,
        PlayerType.BOTTOM_PLAYER,
        SlotType.ACTIVE,
        [SlotType.ACTIVE, SlotType.BENCH],
        { provides: [CardType.PSYCHIC] },
      );
    }

    return state;
  }
}
