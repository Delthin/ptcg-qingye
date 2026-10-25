import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_POISIONED } from '../../../game/store/prefabs/attack-effects';
import { YOUR_OPPONENT_CANNOT_ATTACH_ENERGY_FROM_HAND_TO_DEFENDING_POKEMON } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Glimmora extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Glimmet';
  public cardType: CardType[] = [F];
  public hp: number = 130;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Corrosive Shards',
      cost: [C],
      damage: 20,
      text: 'Your opponent\'s Active Pokémon is now Poisoned. During your opponent\'s next turn, Energy cards can\'t be attached from your opponent\'s hand to that Pokémon.',
    },
    {
      name: 'Rock Throw',
      cost: [F, C],
      damage: 60,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '115';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Glimmora';
  public fullName: string = 'Glimmora SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_POISIONED(store, state, effect);
      YOUR_OPPONENT_CANNOT_ATTACH_ENERGY_FROM_HAND_TO_DEFENDING_POKEMON(store, state, effect, this);
    }

    return state;
  }
}
