import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MULTIPLE_COIN_FLIPS_PROMPT, SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED } from '../../../game/store/prefabs/attack-effects';

export class Oinkologne extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Lechonk';
  public cardType: CardType[] = [C];
  public hp: number = 130;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Finest Selection',
      cost: [C, C],
      damage: 0,
      text: 'Flip 3 coins. Put a number of cards up to the number of heads from your discard pile into your hand.'
    },
    {
      name: 'Perfume Press',
      cost: [C, C, C],
      damage: 70,
      text: 'Your opponent\'s Active Pokémon is now Confused.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '72';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Oinkologne';
  public fullName: string = 'Oinkologne PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 3, results => {
        const heads = results.filter(result => result).length;

        if (heads === 0 || player.discard.cards.length === 0) {
          return;
        }

        SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND(
          store, state, player, this, {}, { min: 0, max: heads }, effect);
      });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
    }

    return state;
  }
}
