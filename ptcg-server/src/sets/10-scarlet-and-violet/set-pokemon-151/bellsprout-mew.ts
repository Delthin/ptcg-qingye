import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Bellsprout extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 60;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Cut',
      cost: [G],
      damage: 10,
      text: '',
    },
    {
      name: 'Bind Down',
      cost: [G, C],
      damage: 20,
      text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '69';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Bellsprout';
  public fullName: string = 'Bellsprout MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = BLOCK_RETREAT(store, state, effect, this);
    }

    return state;
  }
}
