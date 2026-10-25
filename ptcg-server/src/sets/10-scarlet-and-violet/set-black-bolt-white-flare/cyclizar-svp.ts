import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  WAS_ATTACK_USED,
  FLIP_UNTIL_TAILS_AND_COUNT_HEADS,
  DRAW_CARDS,
  THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN,
} from '../../../game/store/prefabs/prefabs';

export class Cyclizar extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [{
    name: 'Flat-Out Dash',
    cost: [C],
    damage: 0,
    text: 'Flip a coin until you get tails. For each heads, draw a card.',
  }, {
    name: 'Power Tackle',
    cost: [C, C, C],
    damage: 120,
    text: 'During your next turn, this Pokémon can\'t attack.',
  }];

  public regulationMark = 'G';
  public set: string = 'SVP';
  public setNumber: string = '96';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Cyclizar';
  public fullName: string = 'Cyclizar SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      return FLIP_UNTIL_TAILS_AND_COUNT_HEADS(store, state, player, (heads) => {
        if (heads > 0) {
          DRAW_CARDS(store, state, player, heads);
        }
      });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN(effect.player);
    }

    return state;
  }
}
