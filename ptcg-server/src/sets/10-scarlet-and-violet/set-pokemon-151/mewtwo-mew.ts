import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { THIS_POKEMON_RETALIATES_ON_DAMAGE_DURING_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

// The prefab owns the retaliation window; the marker keeps it scoped to this card
// (the option type is derived from the prefab signature so the call stays type-safe).
type RetaliateOnDamageOptions = Parameters<
  typeof THIS_POKEMON_RETALIATES_ON_DAMAGE_DURING_OPPONENTS_NEXT_TURN
>[4];

const REFLECTIVE_BARRIER_OPTIONS = {
  marker: 'REFLECTIVE_BARRIER',
} as unknown as RetaliateOnDamageOptions;

export class Mewtwo extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 130;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Reflective Barrier',
      cost: [C, C],
      damage: 20,
      text: 'During your opponent\'s next turn, if this Pokémon is damaged by an attack (even if it is Knocked Out), put damage counters on the Attacking Pokémon equal to the damage done to this Pokémon.'
    },
    {
      name: 'Psyslash',
      cost: [P, P, C],
      damage: 130,
      text: 'Discard 2 Energy from this Pokémon.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '150';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mewtwo';
  public fullName: string = 'Mewtwo MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      // "During your opponent's next turn, if this Pokémon is damaged by an attack
      // (even if it is Knocked Out), put damage counters on the Attacking Pokémon
      // equal to the damage done to this Pokémon."
      state = THIS_POKEMON_RETALIATES_ON_DAMAGE_DURING_OPPONENTS_NEXT_TURN(
        store, state, effect, this, REFLECTIVE_BARRIER_OPTIONS
      );
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      // "Discard 2 Energy from this Pokémon." (mandatory, any type)
      state = DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 2, {}, 2);
    }

    return state;
  }
}
