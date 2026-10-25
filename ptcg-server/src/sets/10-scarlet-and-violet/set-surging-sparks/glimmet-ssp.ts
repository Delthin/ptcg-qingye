import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACKS_DAMAGE_ISNT_AFFECTED_BY_EFFECTS } from '../../../game/store/prefabs/attack-effects';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Glimmet extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 70;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Rock Hurl',
    cost: [F],
    damage: 10,
    text: 'This attack\'s damage isn\'t affected by Resistance.',
  }];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '114';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Glimmet';
  public fullName: string = 'Glimmet SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Rock Hurl: This attack's damage isn't affected by Resistance.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      THIS_ATTACKS_DAMAGE_ISNT_AFFECTED_BY_EFFECTS(store, state, effect, 10);
    }
    return state;
  }
}
