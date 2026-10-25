import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SWITCH_OUT_OPPONENT_ACTIVE_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Whismur extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 70;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Push Down',
    cost: [C],
    damage: 10,
    text: 'Switch out your opponent\'s Active Pokémon to the Bench. (Your opponent chooses the new Active Pokémon.)'
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '148';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Whismur';
  public fullName: string = 'Whismur PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = SWITCH_OUT_OPPONENT_ACTIVE_POKEMON(store, state, player);
    }
    return state;
  }
}
