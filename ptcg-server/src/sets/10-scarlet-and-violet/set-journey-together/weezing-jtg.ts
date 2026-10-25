import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { EndTurnEffect } from '../../../game/store/effects/game-phase-effects';
import {
  ADD_MARKER,
  HAS_MARKER,
  REMOVE_MARKER,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED } from '../../../game/store/prefabs/attack-effects';

const PERVASIVE_GAS_THIS_TURN = 'PERVASIVE_GAS_THIS_TURN';
const PERVASIVE_GAS_LAST_TURN = 'PERVASIVE_GAS_LAST_TURN';

export class Weezing extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Koffing';
  public cardType: CardType[] = [D];
  public hp: number = 130;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Pervasive Gas',
      cost: [D],
      damage: 30,
      text: 'Your opponent\'s Active Pokémon is now Confused.',
    },
    {
      name: 'Crazy Blast',
      cost: [D, C],
      damage: 50,
      damageCalculation: '+' as const,
      text: 'If this Pokémon used Pervasive Gas during your last turn, this attack does 120 more damage.',
    },
  ];

  public regulationMark = 'I';
  public set: string = 'JTG';
  public setNumber: string = '92';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Weezing';
  public fullName: string = 'Weezing JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
      ADD_MARKER(PERVASIVE_GAS_THIS_TURN, effect.player, this);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      if (HAS_MARKER(PERVASIVE_GAS_LAST_TURN, effect.player, this)) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 120);
      }
    }

    if (effect instanceof EndTurnEffect) {
      if (HAS_MARKER(PERVASIVE_GAS_THIS_TURN, effect.player, this)) {
        // Pervasive Gas was used this turn; from the next turn on it counts as "your last turn".
        REMOVE_MARKER(PERVASIVE_GAS_THIS_TURN, effect.player, this);
        ADD_MARKER(PERVASIVE_GAS_LAST_TURN, effect.player, this);
      } else if (HAS_MARKER(PERVASIVE_GAS_LAST_TURN, effect.player, this)) {
        // A full turn has passed without re-using Pervasive Gas: the window has expired.
        REMOVE_MARKER(PERVASIVE_GAS_LAST_TURN, effect.player, this);
      }
    }

    return state;
  }
}
