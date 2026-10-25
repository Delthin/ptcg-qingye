import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HEAL_X_DAMAGE_FROM_THIS_POKEMON } from '../../../game/store/prefabs/attack-effects';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Golbat extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Zubat';

  public cardType: CardType[] = [D];

  public hp: number = 80;

  public weakness = [{ type: L }];

  public resistance = [{ type: F, value: -30 }];

  public retreat = [C];

  public attacks = [{
    name: 'Leech Life',
    cost: [C, C],
    damage: 30,
    text: 'Heal from this Pokémon the same amount of damage you did to your opponent\'s Active Pokémon.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '111';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Golbat';
  public fullName: string = 'Golbat PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      HEAL_X_DAMAGE_FROM_THIS_POKEMON(effect.damage, effect, store, state);
    }
    return state;
  }
}
