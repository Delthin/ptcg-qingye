import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType } from '../../../game/store/card/card-types';
import { PlayerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Tauros extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Gather the Crew',
      cost: [C],
      damage: 0,
      text: 'Search your deck for a Basic Pokémon and put it onto your Bench. Then, shuffle your deck.',
    },
    {
      name: 'Rage',
      cost: [C, C],
      damage: 30,
      damageCalculation: '+',
      text: 'This attack does 10 more damage for each damage counter on this Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '128';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tauros';
  public fullName: string = 'Tauros MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Gather the Crew: search a Basic Pokémon from the deck onto the Bench, then shuffle.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH(store, state, player, {
        superType: SuperType.POKEMON,
        stage: Stage.BASIC,
      });
    }

    // Rage: base 30, +10 for each damage counter on this Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      let damageCounters = 0;

      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        if (cardList.getPokemonCard() === this) {
          damageCounters = Math.floor(cardList.damage / 10);
        }
      });

      if (damageCounters > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, damageCounters * 10);
      }
    }

    return state;
  }
}
