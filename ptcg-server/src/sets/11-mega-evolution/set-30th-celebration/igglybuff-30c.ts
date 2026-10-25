import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckHpEffect } from '../../../game/store/effects/check-effects';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Igglybuff extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 30;
  public weakness = [{ type: F }];
  public retreat = [];

  public attacks = [{
    name: 'Bouncy Circle',
    cost: [],
    damage: 30,
    damageCalculation: 'x',
    text: 'This attack does 30 damage for each of your Benched Pokémon that has a maximum HP of 30.'
  }];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '120';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Igglybuff';
  public fullName: string = 'Igglybuff 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      let matchingBenchCount = 0;

      for (const bench of player.bench) {
        if (bench.cards.length === 0) {
          continue;
        }

        const checkHpEffect = new CheckHpEffect(player, bench);
        state = store.reduceEffect(state, checkHpEffect);

        if (checkHpEffect.hp === 30) {
          matchingBenchCount += 1;
        }
      }

      effect.damage = 30 * matchingBenchCount;
    }

    return state;
  }
}
