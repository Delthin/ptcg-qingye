import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { THIS_POKEMON_TAKES_LESS_DAMAGE_FROM_ATTACKS_DURING_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Tornadus extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 110;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Knuckle Punch',
      cost: [C, C],
      damage: 50,
      text: '',
    },
    {
      name: 'Storm Barrier',
      cost: [C, C, C],
      damage: 100,
      text: 'During your opponent\'s next turn, this Pokémon takes 50 less damage from attacks (after applying Weakness and Resistance).',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '120';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tornadus';
  public fullName: string = 'Tornadus SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = THIS_POKEMON_TAKES_LESS_DAMAGE_FROM_ATTACKS_DURING_OPPONENTS_NEXT_TURN(store, state, effect, 50);
    }
    return state;
  }
}
