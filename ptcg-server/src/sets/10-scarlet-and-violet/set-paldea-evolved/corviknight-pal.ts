import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';
import { PREVENT_DAMAGE, PREVENT_EFFECTS_OF_ATTACKS } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Corviknight extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Corvisquire';
  public cardType: CardType[] = [M];
  public hp: number = 170;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Accelerate',
      cost: [M],
      damage: 50,
      text: 'If your opponent\'s Pokémon is Knocked Out by damage from this attack, during your opponent\'s next turn, prevent all damage from and effects of attacks done to this Pokémon.',
    },
    {
      name: 'Spinning Bird',
      cost: [M, C, C],
      damage: 200,
      text: 'Discard 2 Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '148';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Corviknight';
  public fullName: string = 'Corviknight PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Accelerate: after this attack, this Pokémon is protected from attacks during
    // your opponent's next turn (the Knock Out condition is not evaluated here,
    // see the report's uncertainty note).
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = PREVENT_DAMAGE(store, state, effect, this);
      state = PREVENT_EFFECTS_OF_ATTACKS(store, state, effect, this);
    }

    // Spinning Bird: discard 2 Energy from this Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 2);
    }

    return state;
  }
}
