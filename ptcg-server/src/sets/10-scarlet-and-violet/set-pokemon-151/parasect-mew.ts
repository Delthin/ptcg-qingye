import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  MULTIPLE_COIN_FLIPS_PROMPT,
  SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Parasect extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Paras';
  public cardType: CardType[] = [G];
  public hp: number = 120;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Spread Filaments',
      cost: [G],
      damage: 0,
      text: 'Flip 2 coins. Search your deck for a number of Grass Pokémon up to the number of heads ' +
        'and put them onto your Bench. Then, shuffle your deck.'
    },
    {
      name: 'Claw Slash',
      cost: [C, C],
      damage: 50,
      text: ''
    }
  ];

  public set: string = 'MEW';
  public regulationMark = 'G';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '47';
  public name: string = 'Parasect';
  public fullName: string = 'Parasect MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Spread Filaments: flip 2 coins, then search up to that many Grass Pokémon onto the Bench.
    // Ref: set-surging-sparks/maushold.ts (coin/search onto bench + value filter via `blocked`),
    //      set-pitch-black/bombirdier.ts (MULTIPLE_COIN_FLIPS_PROMPT then deck search).
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 2, results => {
        const heads = results.filter(r => r).length;
        if (heads === 0) {
          return;
        }

        // ChooseCardsPrompt compares filter.cardType by reference, so restrict by
        // card id via `blocked` (same workaround as maushold.ts) instead of cardType.
        const blocked: number[] = [];
        player.deck.cards.forEach((card, index) => {
          if (card instanceof PokemonCard && card.cardType.includes(G)) {
            return;
          }
          blocked.push(index);
        });

        SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH(
          store,
          state,
          player,
          {},
          { min: 0, max: heads, allowCancel: false, blocked }
        );
      });
    }

    // Claw Slash is vanilla damage handled by the attack pipeline.
    return state;
  }
}
