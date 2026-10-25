import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH } from '../../../game/store/prefabs/prefabs';
import { FLIP_COIN_FOR_FLY } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Squawkabilly extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 70;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Call for Family',
      cost: [C],
      damage: 0,
      text: 'Search your deck for up to 2 Basic Pokémon and put them onto your Bench. Then, shuffle your deck.',
    },
    {
      name: 'Fly',
      cost: [C, C],
      damage: 60,
      text: 'Flip a coin. If tails, this attack does nothing. If heads, during your opponent\'s next turn, prevent all damage from and effects of attacks done to this Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '162';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Squawkabilly';
  public fullName: string = 'Squawkabilly SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH(
        store, state, player,
        { stage: Stage.BASIC },
        { min: 0, max: 2 },
      );
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = FLIP_COIN_FOR_FLY(store, state, effect, this);
    }

    return state;
  }
}
