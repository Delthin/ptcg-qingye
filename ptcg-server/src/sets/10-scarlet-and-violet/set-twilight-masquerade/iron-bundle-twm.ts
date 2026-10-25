import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  SWITCH_ACTIVE_WITH_BENCHED,
  SWITCH_OUT_OPPONENT_ACTIVE_POKEMON,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class IronBundle extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 90;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [{
    name: 'Interjet',
    cost: [W, C],
    damage: 60,
    text: 'Switch this Pokémon with 1 of your Benched Pokémon. If you do, switch out your opponent\'s Active Pokémon to the Bench. (Your opponent chooses the new Active Pokémon.)',
  }];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '62';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Iron Bundle';
  public fullName: string = 'Iron Bundle TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // "If you do" — the opponent's Active Pokémon is only switched out when
      // this Pokémon can actually be switched with a Benched Pokémon.
      const hasBenchedPokemon = player.bench.some(bench => bench.cards.length > 0);

      if (hasBenchedPokemon) {
        // SWITCH_ACTIVE_WITH_BENCHED returns State | undefined (prompt based),
        // so fall back to the current state to keep the reducer's State type.
        state = SWITCH_ACTIVE_WITH_BENCHED(store, state, player) ?? state;
        state = SWITCH_OUT_OPPONENT_ACTIVE_POKEMON(store, state, player);
      }
    }
    return state;
  }
}
