import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_CONFUSION_TO_PLAYER_ACTIVE,
  ADD_POISON_TO_PLAYER_ACTIVE,
  COIN_FLIP_PROMPT,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Ekans extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 60;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Poison Blend',
      cost: [D],
      damage: 0,
      text: 'Flip a coin. If heads, your opponent\'s Active Pokémon is now Confused and Poisoned.',
    },
    {
      name: 'Bite',
      cost: [D, D],
      damage: 30,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '100';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Ekans';
  public fullName: string = 'Ekans TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }
        ADD_CONFUSION_TO_PLAYER_ACTIVE(store, state, opponent, this);
        ADD_POISON_TO_PLAYER_ACTIVE(store, state, opponent, this);
      });
    }

    return state;
  }
}
