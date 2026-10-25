import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  WAS_ATTACK_USED,
  FLIP_UNTIL_TAILS_AND_COUNT_HEADS,
  DRAW_CARDS,
} from '../../../game/store/prefabs/prefabs';

export class Magikarp extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 30;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [{
    name: 'Splashy Splash',
    cost: [W],
    damage: 0,
    text: 'Flip a coin until you get tails. For each heads, draw a card.',
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '129';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Magikarp';
  public fullName: string = 'Magikarp MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = FLIP_UNTIL_TAILS_AND_COUNT_HEADS(store, state, player, heads => {
        if (heads > 0) {
          DRAW_CARDS(store, state, player, heads);
        }
      });
    }

    return state;
  }
}
