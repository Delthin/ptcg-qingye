import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SWITCH_ACTIVE_WITH_BENCHED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_BURNED } from '../../../game/store/prefabs/attack-effects';

export class Rapidash extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Ponyta';
  public cardType: CardType[] = [R];
  public hp: number = 100;
  public weakness = [{ type: W }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Singe',
      cost: [R],
      damage: 0,
      text: 'Your opponent\'s Active Pokémon is now Burned.',
    },
    {
      name: 'Mach Turn',
      cost: [R, C, C],
      damage: 90,
      text: 'Switch this Pokémon with 1 of your Benched Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '78';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Rapidash';
  public fullName: string = 'Rapidash MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_BURNED(store, state, effect);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      SWITCH_ACTIVE_WITH_BENCHED(store, state, effect.player);
    }

    return state;
  }
}
