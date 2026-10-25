import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP } from '../../../game/store/prefabs/attack-effects';

export class Slakoth extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 70;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Yawn',
    cost: [C, C],
    damage: 0,
    text: 'Your opponent\'s Active Pokémon is now Asleep.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '160';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Slakoth';
  public fullName: string = 'Slakoth PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP(store, state, effect);
    }
    return state;
  }
}
