import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  SWITCH_OUT_OPPONENT_ACTIVE_POKEMON,
  THIS_POKEMON_DOES_DAMAGE_TO_ITSELF,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Magnezone extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Magneton';
  public cardType: CardType[] = [L];
  public hp: number = 170;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Magnetic Repulsion',
      cost: [L],
      damage: 50,
      text: 'You may switch out your opponent\'s Active Pokémon to the Bench. (Your opponent chooses the new Active Pokémon.)'
    },
    {
      name: 'Thunder',
      cost: [L, C, C],
      damage: 180,
      text: 'This Pokémon also does 30 damage to itself.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '65';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Magnezone';
  public fullName: string = 'Magnezone OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = SWITCH_OUT_OPPONENT_ACTIVE_POKEMON(store, state, player);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 30);
    }

    return state;
  }
}
