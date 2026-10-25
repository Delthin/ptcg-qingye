import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { HEAL_X_DAMAGE_FROM_THIS_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Cutiefly extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.PSYCHIC];
  public hp: number = 30;
  public weakness = [{ type: CardType.METAL }];
  public retreat = [CardType.COLORLESS];

  public attacks = [{
    name: 'Mini Drain',
    cost: [CardType.COLORLESS],
    damage: 10,
    text: 'Heal 10 damage from this Pokémon.',
  }];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '75';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Cutiefly';
  public fullName: string = 'Cutiefly TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      HEAL_X_DAMAGE_FROM_THIS_POKEMON(10, effect, store, state);
    }
    return state;
  }
}
