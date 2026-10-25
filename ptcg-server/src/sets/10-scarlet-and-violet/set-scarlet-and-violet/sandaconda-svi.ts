import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  MOVE_CARDS,
  SHUFFLE_DECK,
  SWITCH_IN_OPPONENT_BENCHED_POKEMON,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class Sandaconda extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Silicobra';
  public cardType: CardType[] = [F];
  public hp: number = 140;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Skull Bash',
      cost: [F, F, C],
      damage: 120,
      text: '',
    },
    {
      name: 'Sandstorm Spray',
      cost: [F, F, F, C],
      damage: 0,
      text: 'Discard 2 Energy from this Pokémon. If you discarded any Energy in this way, your opponent shuffles their Active Pokémon and all attached cards into their deck.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '120';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Sandaconda';
  public fullName: string = 'Sandaconda SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      // Discard 2 Energy from this Pokémon (as many as possible if fewer are attached).
      let discardedAnyEnergy = false;
      state = DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 2, {}, 2, transfers => {
        discardedAnyEnergy = transfers.length > 0;
      });

      if (!discardedAnyEnergy) {
        return state;
      }

      if (opponent.active.cards.length === 0) {
        return state;
      }

      // Opponent shuffles their Active Pokémon and all attached cards into their deck.
      const cardsToShuffle = opponent.active.cards.slice();
      state = MOVE_CARDS(store, state, opponent.active, opponent.deck, { cards: cardsToShuffle });
      state = SHUFFLE_DECK(store, state, opponent);

      // Their new Active Pokémon is chosen from the Bench.
      const hasBenchedPokemon = opponent.bench.some(bench => bench.cards.length > 0);
      if (hasBenchedPokemon) {
        state = SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, player);
      }
    }

    return state;
  }
}
