import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED } from '../../../game/store/prefabs/attack-effects';

export class Aromatisse extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Spritzee';
  public cardType: CardType[] = [P];
  public hp: number = 120;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [{
    name: 'Perfume Press',
    cost: [P, C],
    damage: 60,
    text: 'Your opponent\'s Active Pokémon is now Confused.'
  }];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '39';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Aromatisse';
  public fullName: string = 'Aromatisse PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
    }

    return state;
  }
}
