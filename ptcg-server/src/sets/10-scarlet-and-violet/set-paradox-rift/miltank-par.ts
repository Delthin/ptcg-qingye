import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HealEffect } from '../../../game/store/effects/game-effects';
import { EndTurnEffect } from '../../../game/store/effects/game-phase-effects';
import {
  ADD_MARKER, HAS_MARKER, REMOVE_MARKER_AT_END_OF_TURN, THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Miltank extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Lively Tackle',
    cost: [C, C],
    damage: 60,
    damageCalculation: '+' as const,
    text: 'If this Pokémon was healed during this turn, this attack does 90 more damage.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '147';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Miltank';
  public fullName: string = 'Miltank PAR';

  private readonly HEALED_THIS_TURN_MARKER = 'MILTANK_HEALED_THIS_TURN';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Remember that this Pokémon was healed during the current turn.
    if (effect instanceof HealEffect && effect.target.getPokemonCard() === this) {
      ADD_MARKER(this.HEALED_THIS_TURN_MARKER, effect.target, this);
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      if (HAS_MARKER(this.HEALED_THIS_TURN_MARKER, effect.source, this)) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 90);
      }
    }

    // The heal has to have happened during this turn only.
    if (effect instanceof EndTurnEffect) {
      REMOVE_MARKER_AT_END_OF_TURN(effect, this.HEALED_THIS_TURN_MARKER, this);
    }

    return state;
  }
}
