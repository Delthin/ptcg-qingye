import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Tauros extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Destructive Horn',
    cost: [C, C, C],
    damage: 70,
    text: 'Flip a coin. If heads, discard an Energy from your opponent\'s Active Pokémon.',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '112';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tauros';
  public fullName: string = 'Tauros SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = COIN_FLIP_PROMPT(store, state, player, (result) => {
        if (!result) {
          return;
        }
        state = DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON(store, state, effect, undefined, 1);
      });
    }

    return state;
  }
}
