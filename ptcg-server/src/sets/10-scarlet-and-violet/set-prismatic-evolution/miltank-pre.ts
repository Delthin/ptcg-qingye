import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { EndTurnEffect } from '../../../game/store/effects/game-phase-effects';
import {
  ADD_MARKER,
  HAS_MARKER,
  REMOVE_MARKER,
  THIS_POKEMON_CANNOT_USE_THIS_ATTACK_NEXT_TURN,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Miltank extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 130;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Rollout',
      cost: [C],
      damage: 20,
      text: '',
    },
    {
      name: 'Moomoo Rolling',
      cost: [C, C],
      damage: 100,
      text: 'You can use this attack only if this Pokémon used Rollout during your last turn.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '81';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Miltank';
  public fullName: string = 'Miltank PRE';

  private readonly ROLLOUT_USED_MARKER = 'MILTANK_ROLLOUT_USED_THIS_TURN';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Rollout: remember that this Pokemon used Rollout during the current turn.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      ADD_MARKER(this.ROLLOUT_USED_MARKER, effect.player, this);
    }

    // Moomoo Rolling can only be used if Rollout was used during your last turn:
    // when a turn ends without Rollout, lock Moomoo Rolling for the next turn.
    if (effect instanceof EndTurnEffect) {
      const player = effect.player;

      if (HAS_MARKER(this.ROLLOUT_USED_MARKER, player, this)) {
        REMOVE_MARKER(this.ROLLOUT_USED_MARKER, player, this);
      } else {
        THIS_POKEMON_CANNOT_USE_THIS_ATTACK_NEXT_TURN(player, this.attacks[1]);
      }
    }

    return state;
  }
}
