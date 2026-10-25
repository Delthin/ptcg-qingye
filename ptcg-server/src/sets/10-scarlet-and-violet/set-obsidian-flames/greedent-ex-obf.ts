import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  DRAW_CARDS,
  MOVE_CARDS,
  SELECT_PROMPT,
  SHOW_CARDS_TO_PLAYER,
  TERA_RULE,
  THIS_POKEMON_CANNOT_USE_THIS_ATTACK_NEXT_TURN,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Greedentex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Skwovet';
  public cardType: CardType[] = [C];
  public hp: number = 260;
  public weakness = [{ type: F }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Never Ever Enough',
      cost: [C],
      damage: 0,
      text: 'Look at the top 3 cards of your deck. You may put those cards into your hand. If you don\'t, discard those cards and draw 3 cards.',
    },
    {
      name: 'Slip \'n\' Roll',
      cost: [C, C, C],
      damage: 210,
      text: 'During your next turn, this Pokémon can\'t use Slip \'n\' Roll.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '179';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Greedent ex';
  public fullName: string = 'Greedent ex OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Tera: as long as this Pokémon is on your Bench, prevent all damage done to it by attacks.
    TERA_RULE(effect, state, this);

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      if (player.deck.cards.length === 0) {
        return state;
      }

      const topCards = player.deck.cards.slice(0, Math.min(3, player.deck.cards.length));
      state = SHOW_CARDS_TO_PLAYER(store, state, player, topCards);

      state = SELECT_PROMPT(
        store, state, player,
        ['Put those cards into your hand', 'Discard those cards and draw 3 cards'],
        (result) => {
          if (result === 0) {
            state = MOVE_CARDS(store, state, player.deck, player.hand, { cards: topCards });
          } else {
            state = MOVE_CARDS(store, state, player.deck, player.discard, { cards: topCards });
            state = DRAW_CARDS(store, state, player, 3);
          }
        });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      THIS_POKEMON_CANNOT_USE_THIS_ATTACK_NEXT_TURN(player, 'Slip \'n\' Roll');
    }

    return state;
  }
}
