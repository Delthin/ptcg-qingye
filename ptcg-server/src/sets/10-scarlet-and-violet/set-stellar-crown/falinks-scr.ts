import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { EndTurnEffect } from '../../../game/store/effects/game-phase-effects';
import {
  ADD_MARKER,
  HAS_MARKER,
  REMOVE_MARKER,
  SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Falinks extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 110;
  public weakness = [{ type: P }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Form Ranks',
      cost: [C],
      damage: 0,
      text: 'Search your deck for up to 2 Basic Pokémon and put them onto your Bench. Then, shuffle your deck.',
    },
    {
      name: 'All-Out Attack',
      cost: [C, C],
      damage: 30,
      damageCalculation: '+',
      text: 'If this Pokémon used Form Ranks during your last turn, this attack does 90 more damage.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '88';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Falinks';
  public fullName: string = 'Falinks SCR';

  private readonly FORM_RANKS_LAST_TURN = 'FORM_RANKS_LAST_TURN';
  private readonly FORM_RANKS_THIS_TURN = 'FORM_RANKS_THIS_TURN';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Form Ranks: search 2 Basic Pokémon onto the Bench; mark the turn it was used.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      ADD_MARKER(this.FORM_RANKS_LAST_TURN, player, this);
      ADD_MARKER(this.FORM_RANKS_THIS_TURN, player, this);

      SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH(
        store, state, player,
        { stage: Stage.BASIC },
        { max: 2 },
      );
    }

    // All-Out Attack: +90 if Form Ranks was used during your last turn.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      if (HAS_MARKER(this.FORM_RANKS_LAST_TURN, player, this)
        && !HAS_MARKER(this.FORM_RANKS_THIS_TURN, player, this)) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 90);
      }

      REMOVE_MARKER(this.FORM_RANKS_LAST_TURN, player, this);
    }

    // Marker lifecycle: "this turn" marker is dropped at the end of the turn it was set,
    // so the "last turn" marker (and its bonus) survives exactly one full turn cycle.
    if (effect instanceof EndTurnEffect) {
      const player = effect.player;

      if (HAS_MARKER(this.FORM_RANKS_THIS_TURN, player, this)) {
        REMOVE_MARKER(this.FORM_RANKS_THIS_TURN, player, this);
      } else {
        REMOVE_MARKER(this.FORM_RANKS_LAST_TURN, player, this);
      }
    }

    return state;
  }
}
