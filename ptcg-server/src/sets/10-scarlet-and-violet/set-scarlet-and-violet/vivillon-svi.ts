import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_BURN_TO_PLAYER_ACTIVE,
  ADD_CONFUSION_TO_PLAYER_ACTIVE,
  ADD_PARALYZED_TO_PLAYER_ACTIVE,
  ADD_POISON_TO_PLAYER_ACTIVE,
  ADD_SLEEP_TO_PLAYER_ACTIVE,
  COIN_FLIP_PROMPT,
  SELECT_PROMPT,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Vivillon extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Spewpa';
  public cardType: CardType[] = [G];
  public hp: number = 120;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Miracle Powder',
      cost: [G],
      damage: 50,
      text: 'Flip a coin. If heads, choose a Special Condition. Your opponent\'s Active Pokémon is now affected by that Special Condition.',
    },
    {
      name: 'Bug Buzz',
      cost: [G, C],
      damage: 110,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '10';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Vivillon';
  public fullName: string = 'Vivillon SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }

        const conditions = ['Asleep', 'Burned', 'Confused', 'Paralyzed', 'Poisoned'];

        SELECT_PROMPT(store, state, player, conditions, choice => {
          switch (choice) {
            case 0:
              ADD_SLEEP_TO_PLAYER_ACTIVE(store, state, opponent, this);
              break;
            case 1:
              ADD_BURN_TO_PLAYER_ACTIVE(store, state, opponent, this);
              break;
            case 2:
              ADD_CONFUSION_TO_PLAYER_ACTIVE(store, state, opponent, this);
              break;
            case 3:
              ADD_PARALYZED_TO_PLAYER_ACTIVE(store, state, opponent, this);
              break;
            case 4:
              ADD_POISON_TO_PLAYER_ACTIVE(store, state, opponent, this);
              break;
          }
        });
      });
    }

    return state;
  }
}
