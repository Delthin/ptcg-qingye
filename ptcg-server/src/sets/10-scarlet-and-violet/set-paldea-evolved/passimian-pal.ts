import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_ENERGY_PROMPT,
  THIS_POKEMON_HAS_ANY_ENERGY_ATTACHED,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Passimian extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 110;
  public weakness = [{ type: P }];
  public retreat = [C];

  public attacks = [{
    name: 'Make the Assist',
    cost: [F, F],
    damage: 70,
    text: 'Move an Energy from this Pokémon to 1 of your Benched Pokémon.'
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '118';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Passimian';
  public fullName: string = 'Passimian PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const hasEnergyAttached = THIS_POKEMON_HAS_ANY_ENERGY_ATTACHED(player.active);
      const hasBench = player.bench.some(bench => bench.cards.length > 0);

      if (!hasEnergyAttached || !hasBench) {
        return state;
      }

      state = ATTACH_ENERGY_PROMPT(
        store,
        state,
        player,
        PlayerType.BOTTOM_PLAYER,
        SlotType.ACTIVE,
        [SlotType.BENCH],
        {},
        { min: 1, max: 1, allowCancel: false },
      );
    }
    return state;
  }
}
