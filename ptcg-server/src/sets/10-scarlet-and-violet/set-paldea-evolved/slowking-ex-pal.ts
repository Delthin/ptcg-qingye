import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { SEARCH_DECK_FOR_CARDS_TO_HAND, TERA_RULE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED } from '../../../game/store/prefabs/attack-effects';

export class Slowkingex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Slowpoke';
  public cardType: CardType[] = [P];
  public hp: number = 270;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Profound Knowledge',
      cost: [P],
      damage: 30,
      text: 'Your opponent\'s Active Pokémon is now Confused.',
    },
    {
      name: 'Wise Headbutt',
      cost: [P, P],
      damage: 130,
      text: 'You may search your deck for up to 2 cards and put them into your hand. Then, shuffle your deck.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '86';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Slowking ex';
  public fullName: string = 'Slowking ex PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Tera rule: as long as this Pokémon is on your Bench, prevent all damage
    // done to it by attacks (both yours and your opponent's).
    if (effect instanceof PutDamageEffect && effect.target.cards.includes(this)) {
      TERA_RULE(effect, state, this);
    }

    // Profound Knowledge: your opponent's Active Pokémon is now Confused.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
    }

    // Wise Headbutt: search the deck for up to 2 cards into hand, then shuffle.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      SEARCH_DECK_FOR_CARDS_TO_HAND(store, state, player, this, {}, { min: 0, max: 2 }, effect);
    }

    return state;
  }
}
