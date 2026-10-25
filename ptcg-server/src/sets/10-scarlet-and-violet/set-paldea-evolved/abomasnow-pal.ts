import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HealEffect } from '../../../game/store/effects/game-effects';
import { IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class Abomasnow extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Snover';
  public cardType: CardType[] = [G];
  public hp: number = 150;
  public weakness = [{ type: R }];
  public retreat = [C, C, C];

  public powers = [{
    name: 'Freezing Disaster',
    powerType: PowerType.ABILITY,
    text: 'Pokémon (both yours and your opponent\'s) can\'t be healed.',
  }];

  public attacks = [{
    name: 'Magnum Punch',
    cost: [G, G, C],
    damage: 110,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '11';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Abomasnow';
  public fullName: string = 'Abomasnow PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Freezing Disaster: Pokémon (both yours and your opponent's) can't be healed.
    if (effect instanceof HealEffect) {
      const owner = state.players.find(player =>
        player.active.getPokemonCard() === this
        || player.bench.some(bench => bench.getPokemonCard() === this));

      if (owner === undefined) {
        return state;
      }

      if (IS_ABILITY_BLOCKED(store, state, owner, this)) {
        return state;
      }

      effect.preventDefault = true;
    }

    return state;
  }
}
