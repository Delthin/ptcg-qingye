import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { ChoosePokemonPrompt, GameMessage, PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP } from '../../../game/store/prefabs/attack-effects';

export class Darkrai extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 130;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Dark Slumber',
      cost: [D],
      damage: 20,
      text: 'Your opponent\'s Active Pokémon is now Asleep.',
    },
    {
      name: 'Night Cyclone',
      cost: [D, D, C],
      damage: 120,
      text: 'Move all Energy from this Pokémon to your Benched Pokémon in any way you like.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '136';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Darkrai';
  public fullName: string = 'Darkrai OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Dark Slumber: Your opponent's Active Pokemon is now Asleep.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP(store, state, effect);
    }

    // Night Cyclone: Move all Energy from this Pokemon to your Benched Pokemon
    // in any way you like.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const source = player.active;
      const benched = player.bench.filter(slot => slot.cards.length > 0);

      const moveAllEnergy = (): void => {
        // CardList -> Card[] via `.cards`; CardList itself has no `length`.
        const attached = source.energies.cards;
        if (attached.length === 0 || benched.length === 0) {
          return;
        }

        // Only one possible destination: move every Energy there at once.
        if (benched.length === 1) {
          state = MOVE_CARDS(store, state, source.energies, benched[0].energies, {
            cards: attached.slice(),
          });
          return;
        }

        const prompt = new ChoosePokemonPrompt(
          player.id,
          GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,
          PlayerType.BOTTOM_PLAYER,
          [SlotType.BENCH],
          { allowCancel: true, min: 1, max: 1 },
        );

        const nextState = store.prompt(state, prompt, results => {
          const remaining = source.energies.cards;
          if (results.length === 0 || remaining.length === 0) {
            return;
          }

          state = MOVE_CARDS(store, state, source.energies, results[0].energies, {
            cards: [remaining[0]],
          });

          moveAllEnergy();
        });

        state = nextState ?? state;
      };

      moveAllEnergy();
    }

    return state;
  }
}
