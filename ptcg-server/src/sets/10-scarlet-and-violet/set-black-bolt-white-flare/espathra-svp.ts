import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { HEAL_X_DAMAGE_FROM_THIS_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Espathra extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Flittle';
  public cardType: CardType[] = [P];
  public hp: number = 110;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [];

  public attacks = [
    {
      name: 'Aurora Gain',
      cost: [C],
      damage: 30,
      text: 'Heal 30 damage from this Pokémon.',
    },
    {
      name: 'Super Psy Bolt',
      cost: [P, C],
      damage: 60,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVP';
  public setNumber: string = '10';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Espathra';
  public fullName: string = 'Espathra SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      HEAL_X_DAMAGE_FROM_THIS_POKEMON(30, effect, store, state);
    }
    return state;
  }
}
