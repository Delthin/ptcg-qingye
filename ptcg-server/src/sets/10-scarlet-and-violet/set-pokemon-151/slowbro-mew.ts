import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ADD_SLEEP_TO_PLAYER_ACTIVE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Slowbro extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Slowpoke';
  public cardType: CardType[] = [P];
  public hp: number = 130;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Big Yawn',
      cost: [P],
      damage: 0,
      text: 'Both Active Pokémon are now Asleep.',
    },
    {
      name: 'Laid-Back Tackle',
      cost: [P, C, C],
      damage: 160,
      text: 'If this Pokémon evolved during this turn, this attack does nothing.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '80';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Slowbro';
  public fullName: string = 'Slowbro MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Big Yawn: Both Active Pokémon are now Asleep.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      ADD_SLEEP_TO_PLAYER_ACTIVE(store, state, effect.player, this);
      ADD_SLEEP_TO_PLAYER_ACTIVE(store, state, effect.opponent, this);
    }

    // Laid-Back Tackle: if this Pokémon evolved during this turn, this attack does nothing.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      if (effect.player.active.pokemonPlayedTurn === state.turn) {
        effect.damage = 0;
      }
    }

    return state;
  }
}
