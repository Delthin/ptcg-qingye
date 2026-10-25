import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { THIS_ATTACKS_DAMAGE_ISNT_AFFECTED_BY_EFFECTS } from '../../../game/store/prefabs/attack-effects';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';
import { THIS_POKEMON_TAKES_LESS_DAMAGE_FROM_ATTACKS_DURING_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Donphan extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Phanpy';
  public cardType: CardType[] = [F];
  public hp: number = 150;
  public weakness = [{ type: G }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Knock Flat',
      cost: [F],
      damage: 40,
      text: 'This attack\'s damage isn\'t affected by any effects on your opponent\'s Active Pokémon.',
    },
    {
      name: 'Guarded Rolling',
      cost: [F, C, C],
      damage: 120,
      text: 'Discard 2 Energy from this Pokémon. During your opponent\'s next turn, this Pokémon takes 100 less damage from attacks (after applying Weakness and Resistance).',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '103';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Donphan';
  public fullName: string = 'Donphan SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      // This attack's damage isn't affected by any effects on your opponent's Active Pokémon.
      THIS_ATTACKS_DAMAGE_ISNT_AFFECTED_BY_EFFECTS(store, state, effect, 40);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      // Discard 2 Energy from this Pokémon.
      state = DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 2, {}, 2);

      // During your opponent's next turn, this Pokémon takes 100 less damage from attacks
      // (after applying Weakness and Resistance).
      state = THIS_POKEMON_TAKES_LESS_DAMAGE_FROM_ATTACKS_DURING_OPPONENTS_NEXT_TURN(store, state, effect, 100);
    }

    return state;
  }
}
