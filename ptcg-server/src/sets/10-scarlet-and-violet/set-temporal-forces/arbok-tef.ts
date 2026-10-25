import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_BURN_TO_PLAYER_ACTIVE,
  ADD_CONFUSION_TO_PLAYER_ACTIVE,
  ADD_POISON_TO_PLAYER_ACTIVE,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Arbok extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Ekans';
  public cardType: CardType[] = [D];
  public hp: number = 130;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Panic Poison',
      cost: [D],
      damage: 0,
      text: 'Your opponent\'s Active Pokémon is now Burned, Confused, and Poisoned.',
    },
    {
      name: 'Darkness Fang',
      cost: [D, D],
      damage: 70,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '101';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Arbok';
  public fullName: string = 'Arbok TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;

      ADD_BURN_TO_PLAYER_ACTIVE(store, state, opponent, this);
      ADD_CONFUSION_TO_PLAYER_ACTIVE(store, state, opponent, this);
      ADD_POISON_TO_PLAYER_ACTIVE(store, state, opponent, this);
    }

    return state;
  }
}
