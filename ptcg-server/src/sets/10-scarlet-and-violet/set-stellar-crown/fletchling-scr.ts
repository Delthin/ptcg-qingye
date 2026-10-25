import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SWITCH_OUT_OPPONENT_ACTIVE_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Fletchling extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 60;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [{
    name: 'Send Back',
    cost: [C],
    damage: 10,
    text: 'Switch out your opponent\'s Active Pokémon to the Bench. (Your opponent chooses the new Active Pokémon.)'
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '121';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Fletchling';
  public fullName: string = 'Fletchling SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = SWITCH_OUT_OPPONENT_ACTIVE_POKEMON(store, state, effect.player);
    }
    return state;
  }
}
