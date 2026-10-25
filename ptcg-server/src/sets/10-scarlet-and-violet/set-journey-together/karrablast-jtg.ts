import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SWITCH_OUT_OPPONENT_ACTIVE_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Karrablast extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 60;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [{
    name: 'Push Down',
    cost: [C],
    damage: 10,
    text: 'Switch out your opponent\'s Active Pokémon to the Bench. (Your opponent chooses the new Active Pokémon.)',
  }];

  public regulationMark = 'I';
  public set: string = 'JTG';
  public setNumber: string = '9';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Karrablast';
  public fullName: string = 'Karrablast JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = SWITCH_OUT_OPPONENT_ACTIVE_POKEMON(store, state, effect.player);
    }
    return state;
  }
}
