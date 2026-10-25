import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Kangaskhan extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 130;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Rage',
    cost: [C, C],
    damage: 20,
    damageCalculation: '+',
    text: 'This attack does 10 more damage for each damage counter on this Pokémon.'
  }, {
    name: 'Mega Punch',
    cost: [C, C, C],
    damage: 100,
    text: ''
  }];

  public regulationMark: string = 'J';
  public set: string = '30C';
  public setNumber: string = '024/040';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Kangaskhan';
  public fullName: string = 'Kangaskhan 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, effect.source.damage);
    }
    return state;
  }
}
