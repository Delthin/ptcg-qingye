import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MOVE_CARDS, SELECT_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED } from '../../../game/store/prefabs/attack-effects';

export class Delcatty extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Skitty';
  public cardType: CardType[] = [C];
  public hp: number = 110;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Tail Trickery',
      cost: [C],
      damage: 30,
      text: 'Your opponent\'s Active Pokémon is now Confused.'
    },
    {
      name: 'Energy Blender',
      cost: [C, C, C],
      damage: 110,
      text: 'You may move any amount of Energy from your Pokémon to your other Pokémon in any way you like.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '131';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Delcatty';
  public fullName: string = 'Delcatty TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      // 'You may move any amount of Energy from your Pokémon to your other Pokémon in any way you like.'
      // Repeat: pick one of your Pokémon that has Energy, pick an Energy card attached to it,
      // pick one of your other Pokémon as the destination, then ask again until the player stops.
      const moveEnergy = (): void => {
        const pokemon = [player.active, ...player.bench].filter(p => p.cards.length > 0);
        const sources = pokemon.filter(p => p.energies.cards.length > 0);

        if (sources.length === 0) {
          return;
        }

        const sourceLabels = sources.map(p => p.getPokemonCard()?.name ?? 'Pokémon');
        sourceLabels.push('Stop moving Energy');

        state = SELECT_PROMPT(store, state, player, sourceLabels, sourceIndex => {
          if (sourceIndex < 0 || sourceIndex >= sources.length) {
            return;
          }

          const source = sources[sourceIndex];
          const energies = source.energies.cards;
          const energyLabels = energies.map(card => card.name);
          energyLabels.push('Stop moving Energy');

          state = SELECT_PROMPT(store, state, player, energyLabels, energyIndex => {
            if (energyIndex < 0 || energyIndex >= energies.length) {
              moveEnergy();
              return;
            }

            const energy = energies[energyIndex];
            const destinations = pokemon.filter(p => p !== source);

            if (destinations.length === 0) {
              moveEnergy();
              return;
            }

            const destinationLabels = destinations.map(p => p.getPokemonCard()?.name ?? 'Pokémon');

            state = SELECT_PROMPT(store, state, player, destinationLabels, destinationIndex => {
              if (destinationIndex < 0 || destinationIndex >= destinations.length) {
                moveEnergy();
                return;
              }

              const destination = destinations[destinationIndex];
              state = MOVE_CARDS(store, state, source.energies, destination.energies, { cards: [energy] });
              moveEnergy();
            });
          });
        });
      };

      moveEnergy();
    }

    return state;
  }
}
