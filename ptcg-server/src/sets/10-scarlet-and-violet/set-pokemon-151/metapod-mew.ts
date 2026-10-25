import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { StoreLike } from '../../../game/store/store-like';
import { State } from '../../../game/store/state/state';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_COIN_TO_PREVENT_DAMAGE_DURING_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Metapod extends PokemonCard {
  public stage = Stage.STAGE_1;
  public evolvesFrom = 'Caterpie';
  public cardType: CardType[] = [G];
  public hp = 90;
  public weakness = [{ type: R }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Tackle',
      cost: [G],
      damage: 20,
      text: ''
    },
    {
      name: 'Defensive Posture',
      cost: [C, C],
      damage: 0,
      text: 'Flip a coin. If heads, during your opponent\'s next turn, prevent all damage done to this Pokémon by attacks.'
    }
  ];

  public regulationMark = 'G';
  public set = 'MEW';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '11';
  public name = 'Metapod';
  public fullName = 'Metapod MEW';

  reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      return FLIP_COIN_TO_PREVENT_DAMAGE_DURING_OPPONENTS_NEXT_TURN(store, state, effect, this);
    }
    return state;
  }
}
