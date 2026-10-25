import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  SWITCH_ACTIVE_WITH_BENCHED,
  SWITCH_OUT_OPPONENT_ACTIVE_POKEMON,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Palkia extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 130;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Wormhole',
    cost: [W, W, C],
    damage: 100,
    text: 'Switch this Pokémon with 1 of your Benched Pokémon. If you do, switch out your opponent\'s Active Pokémon to the Bench. (Your opponent chooses the new Active Pokémon.)'
  }];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '20';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Palkia';
  public fullName: string = 'Palkia 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const hasBenchedPokemon = player.bench.some(slot => slot.cards.length > 0);

      // "If you do" — the opponent's Active Pokémon is only switched out
      // when this Pokémon actually could be (and was) switched with a Benched Pokémon.
      if (hasBenchedPokemon) {
        SWITCH_ACTIVE_WITH_BENCHED(store, state, player);
        state = SWITCH_OUT_OPPONENT_ACTIVE_POKEMON(store, state, player);
      }
    }
    return state;
  }
}
