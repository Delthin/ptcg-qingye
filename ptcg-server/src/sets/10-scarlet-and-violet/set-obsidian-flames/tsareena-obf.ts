import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, THIS_POKEMON_DOES_DAMAGE_TO_ITSELF } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_CANNOT_EVOLVE_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Tsareena extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Steenee';
  public cardType: CardType[] = [G];
  public hp: number = 160;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Queenly Heel',
      cost: [G],
      damage: 60,
      text: 'During your opponent\'s next turn, Pokémon can\'t be played from your opponent\'s hand to evolve the Defending Pokémon.'
    },
    {
      name: 'Spinning Kick',
      cost: [G, G],
      damage: 160,
      text: 'This Pokémon also does 20 damage to itself.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '18';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tsareena';
  public fullName: string = 'Tsareena OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DEFENDING_POKEMON_CANNOT_EVOLVE_NEXT_TURN(store, state, effect, this);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 20);
    }

    return state;
  }
}
