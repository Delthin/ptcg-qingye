import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { PREVENT_DAMAGE } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Metapod extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Caterpie';
  public cardType: CardType[] = [G];
  public hp: number = 90;
  public weakness = [{ type: R }];
  public retreat = [C, C, C];

  public attacks = [{
    name: 'Harden',
    cost: [G],
    damage: 0,
    text: 'During your opponent\'s next turn, prevent all damage done to this Pokémon by attacks if that damage is 60 or less.',
  }];

  public regulationMark = 'I';
  public set: string = 'JTG';
  public setNumber: string = '2';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Metapod';
  public fullName: string = 'Metapod JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return PREVENT_DAMAGE(store, state, effect, this, { maxDamage: 60 });
    }
    return state;
  }
}
