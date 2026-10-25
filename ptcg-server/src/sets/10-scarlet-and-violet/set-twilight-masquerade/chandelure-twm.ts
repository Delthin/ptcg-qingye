import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  DRAW_CARDS, IS_ABILITY_BLOCKED, USE_ABILITY_ONCE_PER_TURN, WAS_ATTACK_USED, WAS_POWER_USED
} from '../../../game/store/prefabs/prefabs';

export class Chandelure extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Lampent';
  public cardType: CardType[] = [R];
  public hp: number = 130;
  public weakness = [{ type: W }];
  public retreat = [C, C];

  public powers = [{
    name: 'Alluring Light',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, you may have each player draw a card.',
  }];

  public attacks = [{
    name: 'Mind Ruler',
    cost: [R],
    damage: 30,
    damageCalculation: 'x',
    text: 'This attack does 30 damage for each card in your opponent\'s hand.',
  }];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '38';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Chandelure';
  public fullName: string = 'Chandelure TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      USE_ABILITY_ONCE_PER_TURN(player, 'Alluring Light', this);

      const opponent = StateUtils.getOpponent(state, player);
      state = DRAW_CARDS(store, state, player, 1);
      state = DRAW_CARDS(store, state, opponent, 1);
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      effect.damage = 30 * effect.opponent.hand.cards.length;
    }

    return state;
  }
}
