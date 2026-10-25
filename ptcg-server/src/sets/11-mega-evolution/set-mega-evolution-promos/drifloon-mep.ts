import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  COIN_FLIP_PROMPT,
  SWITCH_IN_OPPONENT_BENCHED_POKEMON,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Drifloon extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 70;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [{
    name: 'Pull',
    cost: [P],
    damage: 0,
    text: 'Flip a coin. If heads, switch 1 of your opponent\'s Benched Pokémon with their Active Pokémon.'
  }];

  public regulationMark = 'I';
  public set: string = 'MEP';
  public setNumber: string = '5';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Drifloon';
  public fullName: string = 'Drifloon MEP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          state = SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, player);
        }
      });
    }

    return state;
  }
}
