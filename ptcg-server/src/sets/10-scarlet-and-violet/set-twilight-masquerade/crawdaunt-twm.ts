import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  DISCARD_TOP_X_OF_OPPONENTS_DECK,
  MULTIPLE_COIN_FLIPS_PROMPT,
  THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Crawdaunt extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Corphish';
  public cardType: CardType[] = [W];
  public hp: number = 130;
  public weakness = [{ type: L }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Snip Snip',
      cost: [W, C],
      damage: 40,
      text: 'Flip 2 coins. For each heads, discard the top card of your opponent\'s deck.'
    },
    {
      name: 'Rampaging Hammer',
      cost: [W, W, C],
      damage: 180,
      text: 'During your next turn, this Pokémon can\'t attack.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '48';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Crawdaunt';
  public fullName: string = 'Crawdaunt TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 2, results => {
        const heads = results.filter(result => result).length;

        if (heads === 0) {
          return;
        }

        DISCARD_TOP_X_OF_OPPONENTS_DECK(store, state, player, heads, this, effect);
      });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN(effect.player);
    }

    return state;
  }
}
