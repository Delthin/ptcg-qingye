import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckRetreatCostEffect } from '../../../game/store/effects/check-effects';
import { IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class Zoroark30C extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public cardType: CardType[] = [D];
  public hp: number = 120;
  public weakness = [{ type: G }];
  public retreat = [C];

  public powers = [{
    name: 'Nighttime Byway',
    powerType: PowerType.ABILITY,
    text: 'As long as this Pokémon is on your Bench, your Active Pokémon\'s Retreat Cost is ColorlessColorless less.',
  }];

  public attacks = [{
    name: 'Slashing Claw',
    cost: [D, D, C],
    damage: 90,
    text: '',
  }];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '96';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Zoroark';
  public fullName: string = 'Zoroark 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckRetreatCostEffect) {
      const player = effect.player;

      // Ability only applies while this Pokémon is on its owner's Bench.
      const isOnOwnBench = player.bench.some(bench => bench.getPokemonCard() === this);
      if (!isOnOwnBench) {
        return state;
      }

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      // Reduce the Active Pokémon's Retreat Cost by up to 2 Colorless.
      let reduction = 2;
      const cost = [...effect.cost];
      while (reduction > 0) {
        const index = cost.indexOf(CardType.COLORLESS);
        if (index === -1) {
          break;
        }
        cost.splice(index, 1);
        reduction -= 1;
      }
      effect.cost = cost;
    }
    return state;
  }
}
