import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { THIS_POKEMON_RETALIATES_ON_DAMAGE_DURING_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';

// "put damage counters on the Attacking Pokemon equal to the damage done to
// this Pokemon" — the retaliation mode is chosen through the prefab's options.
const RETALIATE_ON_DAMAGE_OPTIONS = {
  equalToDamage: true,
  damageCounters: 'equal',
};

export class Zamazenta extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [M];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Strong Bash',
    cost: [M, M, C],
    damage: 70,
    text: 'During your opponent\'s next turn, if this Pokémon is damaged by an attack (even if this Pokémon is Knocked Out), put damage counters on the Attacking Pokémon equal to the damage done to this Pokémon.',
  }];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '146';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Zamazenta';
  public fullName: string = 'Zamazenta DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = THIS_POKEMON_RETALIATES_ON_DAMAGE_DURING_OPPONENTS_NEXT_TURN(
        store, state, effect, this, RETALIATE_ON_DAMAGE_OPTIONS as never,
      );
    }
    return state;
  }
}
