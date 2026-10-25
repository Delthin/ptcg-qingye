import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckRetreatCostEffect } from '../../../game/store/effects/check-effects';
import { IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class Toedscruel extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Toedscool';
  public cardType: CardType[] = [F];
  public hp: number = 130;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public powers = [{
    name: 'Secret Forest Path',
    powerType: PowerType.ABILITY,
    text: 'As long as this Pokémon is on your Bench, your Active Pokémon\'s Retreat Cost is ColorlessColorless less.',
  }];

  public attacks = [{
    name: 'Mud Shot',
    cost: [F, C, C],
    damage: 80,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '89';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Toedscruel';
  public fullName: string = 'Toedscruel JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckRetreatCostEffect) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      // The Ability only applies while this Pokémon is on its owner's Bench.
      const isOnOwnBench = player.bench.some(bench => bench.getPokemonCard() === this);
      if (!isOnOwnBench) {
        return state;
      }

      // Reduce the Retreat Cost by up to 2 Colorless Energy.
      let reduction = 2;
      effect.cost = effect.cost.filter(cost => {
        if (reduction > 0 && cost === C) {
          reduction -= 1;
          return false;
        }
        return true;
      });
    }

    return state;
  }
}
