import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  SWITCH_ACTIVE_WITH_BENCHED, SWITCH_OUT_OPPONENT_ACTIVE_POKEMON, WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Baltoy extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 70;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Rapid Spin',
    cost: [P],
    damage: 10,
    text: 'Switch this Pokémon with 1 of your Benched Pokémon. If you do, switch out your opponent\'s Active Pokémon to the Bench. (Your opponent chooses the new Active Pokémon.)'
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '94';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Baltoy';
  public fullName: string = 'Baltoy OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // "If you do" — the opponent's Active Pokémon only switches out if this
      // Pokémon could actually be switched with a Benched Pokémon.
      const hasBenchedPokemon = player.bench.some(benchSlot => benchSlot.cards.length > 0);

      state = SWITCH_ACTIVE_WITH_BENCHED(store, state, player) ?? state;

      if (hasBenchedPokemon) {
        state = SWITCH_OUT_OPPONENT_ACTIVE_POKEMON(store, state, player);
      }
    }
    return state;
  }
}
