import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DISCARD_OPPONENTS_ACTIVE_POKEMON } from '../../../game/store/prefabs/attack-effects';
import {
  ADD_MARKER, HAS_MARKER, JUST_EVOLVED, REMOVE_MARKER_AT_END_OF_TURN, WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Exploud extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Loudred';
  public cardType: CardType[] = [C];
  public hp: number = 160;
  public weakness = [{ type: F }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Sudden Shout',
      cost: [C],
      damage: 0,
      text: 'Discard your opponent\'s Active Pokémon and all attached cards. If this Pokémon didn\'t evolve from Loudred during this turn, this attack does nothing.',
    },
    {
      name: 'Headbang',
      cost: [C, C, C],
      damage: 140,
      text: '',
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '150';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Exploud';
  public fullName: string = 'Exploud PAR';

  private readonly evolvedThisTurnMarker = 'EVOLVED_THIS_TURN';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Record the turn this Pokémon evolved from Loudred, so "Sudden Shout" can check it.
    if (JUST_EVOLVED(effect, this)) {
      ADD_MARKER(this.evolvedThisTurnMarker, effect.player, this);
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // If this Pokémon didn't evolve from Loudred during this turn, this attack does nothing.
      if (!HAS_MARKER(this.evolvedThisTurnMarker, player, this)) {
        return state;
      }

      state = DISCARD_OPPONENTS_ACTIVE_POKEMON(store, state, effect);
    }

    REMOVE_MARKER_AT_END_OF_TURN(effect, this.evolvedThisTurnMarker, this);

    return state;
  }
}
