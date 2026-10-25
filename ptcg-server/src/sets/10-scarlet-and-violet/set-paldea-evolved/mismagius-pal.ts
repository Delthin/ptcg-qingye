import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  CONFIRMATION_PROMPT,
  IS_ABILITY_BLOCKED,
  JUST_EVOLVED,
  MOVE_CARDS,
  SELECT_PROMPT,
} from '../../../game/store/prefabs/prefabs';

export class Mismagius extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Misdreavus';
  public cardType: CardType[] = [P];
  public hp: number = 90;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public powers = [{
    name: 'Magical Flick',
    powerType: PowerType.ABILITY,
    text: 'When you play this Pokémon from your hand to evolve 1 of your Pokémon during your turn, you may move an Energy from your opponent\'s Active Pokémon to 1 of their Benched Pokémon.',
  }];

  public attacks = [{
    name: 'Psychic Sphere',
    cost: [P, C],
    damage: 60,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '88';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mismagius';
  public fullName: string = 'Mismagius PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Magical Flick: when this Pokémon is played from hand to evolve one of your Pokémon,
    // you may move an Energy from your opponent's Active Pokémon to 1 of their Benched Pokémon.
    if (JUST_EVOLVED(effect, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      const benched = opponent.bench.filter(bench => bench.cards.length > 0);
      const energies = opponent.active.cards.filter((card): card is EnergyCard => card instanceof EnergyCard);

      if (benched.length === 0 || energies.length === 0) {
        return state;
      }

      const moveEnergyToBench = (energy: EnergyCard, benchSlot: number) => {
        state = MOVE_CARDS(store, state, opponent.active, benched[benchSlot], {
          cards: [energy],
        });
      };

      state = CONFIRMATION_PROMPT(store, state, player, useAbility => {
        if (!useAbility) {
          return;
        }

        const chooseBench = (energy: EnergyCard) => {
          if (benched.length === 1) {
            moveEnergyToBench(energy, 0);
            return;
          }

          const benchNames = benched.map(bench => {
            const pokemon = bench.getPokemonCard();
            return pokemon === undefined ? 'Benched Pokémon' : pokemon.name;
          });

          state = SELECT_PROMPT(store, state, player, benchNames, benchIndex => {
            moveEnergyToBench(energy, benchIndex);
          });
        };

        if (energies.length === 1) {
          chooseBench(energies[0]);
          return;
        }

        const energyNames = energies.map(energy => energy.name);
        state = SELECT_PROMPT(store, state, player, energyNames, energyIndex => {
          chooseBench(energies[energyIndex]);
        });
      });
    }

    return state;
  }
}
