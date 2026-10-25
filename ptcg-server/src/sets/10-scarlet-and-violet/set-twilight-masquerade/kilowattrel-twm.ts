import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { NEXT_TURN_ATTACK_BONUS_ALL_ATTACKS } from '../../../game/store/prefabs/attack-effects';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class Kilowattrel extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Wattrel';
  public cardType: CardType[] = [L];
  public hp: number = 120;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Wind Power Charge',
      cost: [C],
      damage: 10,
      text: 'During your next turn, attacks used by this Pokémon do 120 more damage to your opponent\'s Active Pokémon (before applying Weakness and Resistance).',
    },
    {
      name: 'Strong Volt',
      cost: [L, C],
      damage: 100,
      text: 'Discard an Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '76';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Kilowattrel';
  public fullName: string = 'Kilowattrel TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // "During your next turn, attacks used by this Pokémon do 120 more damage
    // to your opponent's Active Pokémon" — lifecycle helper handles both arming
    // the bonus when Wind Power Charge is used and applying it next turn.
    NEXT_TURN_ATTACK_BONUS_ALL_ATTACKS(effect, {
      source: this,
      bonusDamage: 120,
      setupAttack: this.attacks[0],
    });

    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 1, {}, 1);
    }

    return state;
  }
}
