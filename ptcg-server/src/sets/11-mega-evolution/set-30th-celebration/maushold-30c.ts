import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PlayerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DISCARD_TOP_X_OF_OPPONENTS_DECK, MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Maushold extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public cardType: CardType[] = [CardType.COLORLESS];
  public hp: number = 80;
  public weakness = [{ type: CardType.FIGHTING }];
  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Gnaw Together',
      cost: [CardType.COLORLESS],
      damage: 0,
      text: 'Flip a coin for each Maushold you have in play. For each heads, discard the top 2 cards of your opponent\'s deck.',
    },
    {
      name: 'Pound',
      cost: [CardType.COLORLESS],
      damage: 40,
      text: '',
    },
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '125';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Maushold';
  public fullName: string = 'Maushold 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // Count every Maushold this player has in play (Active + Bench), including this one.
      let mausholdInPlay = 0;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        const pokemonCard = cardList.getPokemonCard();
        if (pokemonCard !== undefined && pokemonCard.name === this.name) {
          mausholdInPlay += 1;
        }
      });

      if (mausholdInPlay > 0) {
        state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, mausholdInPlay, results => {
          const heads = results.filter(result => result).length;
          if (heads > 0) {
            DISCARD_TOP_X_OF_OPPONENTS_DECK(store, state, player, heads * 2, this, effect);
          }
        });
      }
    }

    return state;
  }
}
