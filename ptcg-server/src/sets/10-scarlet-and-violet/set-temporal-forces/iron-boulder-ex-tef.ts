import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { THIS_POKEMON_RETALIATES_ON_DAMAGE_DURING_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class IronBoulderex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 240;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Repulsor Axe',
      cost: [F, C],
      damage: 60,
      text: 'During your opponent\'s next turn, if this Pokémon is damaged by an attack (even if it is Knocked Out), put 8 damage counters on the Attacking Pokémon.',
    },
    {
      name: 'Power Stomp',
      cost: [F, F, C],
      damage: 200,
      text: 'Discard 2 Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '99';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Iron Boulder ex';
  public fullName: string = 'Iron Boulder ex TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Repulsor Axe: retaliate on damage taken during the opponent's next turn,
    // even if this Pokémon is Knocked Out.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = THIS_POKEMON_RETALIATES_ON_DAMAGE_DURING_OPPONENTS_NEXT_TURN(
        store, state, effect, this, { damage: 8 });
    }

    // Power Stomp: discard 2 Energy from this Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 2, {}, 2);
    }

    return state;
  }
}
