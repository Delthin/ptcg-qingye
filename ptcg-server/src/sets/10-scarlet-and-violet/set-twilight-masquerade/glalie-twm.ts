import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class Glalie extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Snorunt';
  public cardType: CardType[] = [W];
  public hp: number = 120;
  public weakness = [{ type: M }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Damage Beat',
      cost: [W],
      damage: 20,
      damageCalculation: 'x',
      text: 'This attack does 20 damage for each damage counter on your opponent\'s Active Pokémon.',
    },
    {
      name: 'Crazy Headbutt',
      cost: [W, C, C],
      damage: 140,
      text: 'Discard an Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '52';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Glalie';
  public fullName: string = 'Glalie TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Damage Beat: 20 damage for each damage counter on the opponent's Active Pokémon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const damageCounters = Math.floor(effect.opponent.active.damage / 10);
      effect.damage = 20 * damageCounters;
    }

    // Crazy Headbutt: discard an Energy from this Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 1, {}, 1);
    }

    return state;
  }
}
