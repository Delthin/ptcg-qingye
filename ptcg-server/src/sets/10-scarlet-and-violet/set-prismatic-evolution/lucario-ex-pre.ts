import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { EndTurnEffect } from '../../../game/store/effects/game-phase-effects';
import {
  ADD_MARKER,
  HAS_MARKER,
  REMOVE_MARKER,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

const TORNADO_RUSH_PENDING = 'TORNADO_RUSH_BONUS_PENDING';
const TORNADO_RUSH_READY = 'TORNADO_RUSH_BONUS_READY';
const TORNADO_RUSH_ACTIVE = 'TORNADO_RUSH_BONUS_ACTIVE';

export class Lucarioex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Riolu';
  public cardType: CardType[] = [F];
  public hp: number = 260;
  public weakness = [{ type: P }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Aura Uppercut',
      cost: [F],
      damage: 50,
      text: '',
    },
    {
      name: 'Tornado Rush',
      cost: [F, C],
      damage: 100,
      text: 'During your next turn, this Pokemon\'s Tornado Rush attack does 100 more damage (before applying Weakness and Resistance).',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '51';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lucario ex';
  public fullName: string = 'Lucario ex PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // "During your next turn" lifecycle, driven by end-of-turn steps:
    // PENDING (armed on your turn) -> READY (after your turn ends)
    // -> ACTIVE (after the opponent's turn ends, i.e. during your next turn)
    // -> removed when your next turn ends.
    if (effect instanceof EndTurnEffect) {
      if (HAS_MARKER(TORNADO_RUSH_PENDING, this, this)) {
        REMOVE_MARKER(TORNADO_RUSH_PENDING, this, this);
        ADD_MARKER(TORNADO_RUSH_READY, this, this);
      } else if (HAS_MARKER(TORNADO_RUSH_READY, this, this)) {
        REMOVE_MARKER(TORNADO_RUSH_READY, this, this);
        ADD_MARKER(TORNADO_RUSH_ACTIVE, this, this);
      } else if (HAS_MARKER(TORNADO_RUSH_ACTIVE, this, this)) {
        REMOVE_MARKER(TORNADO_RUSH_ACTIVE, this, this);
      }
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      if (HAS_MARKER(TORNADO_RUSH_ACTIVE, this, this)) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 100);
        REMOVE_MARKER(TORNADO_RUSH_ACTIVE, this, this);
      }
      ADD_MARKER(TORNADO_RUSH_PENDING, this, this);
    }

    return state;
  }
}
