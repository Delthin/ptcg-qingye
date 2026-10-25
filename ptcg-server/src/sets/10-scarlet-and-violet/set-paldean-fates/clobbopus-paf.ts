import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { THIS_ATTACKS_DAMAGE_ISNT_AFFECTED_BY_EFFECTS } from '../../../game/store/prefabs/attack-effects';

export class Clobbopus extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 70;
  public weakness = [{ type: P }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Feint',
    cost: [F],
    damage: 20,
    text: 'This attack\'s damage isn\'t affected by Resistance.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '51';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Clobbopus';
  public fullName: string = 'Clobbopus PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      THIS_ATTACKS_DAMAGE_ISNT_AFFECTED_BY_EFFECTS(store, state, effect, 20);
    }
    return state;
  }
}
