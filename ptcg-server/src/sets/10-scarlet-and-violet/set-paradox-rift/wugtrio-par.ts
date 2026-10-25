import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType, TrainerType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  CONFIRMATION_PROMPT, IS_ABILITY_BLOCKED, JUST_EVOLVED, MULTIPLE_COIN_FLIPS_PROMPT,
  SEARCH_DECK_FOR_CARDS_TO_HAND, THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Wugtrio extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Wiglett';
  public cardType: CardType[] = [W];
  public hp: number = 90;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public powers = [{
    name: 'Suddenly Select',
    powerType: PowerType.ABILITY,
    text: 'When you play this Pokémon from your hand to evolve 1 of your Pokémon during your turn, you may search your deck for up to 3 Pokémon Tool cards, reveal them, and put them into your hand. Then, shuffle your deck.',
  }];

  public attacks = [{
    name: 'Triple Whip',
    cost: [W, W],
    damage: 70,
    damageCalculation: 'x',
    text: 'Flip 3 coins. This attack does 70 damage for each heads.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '53';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Wugtrio';
  public fullName: string = 'Wugtrio PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Suddenly Select: on evolving from hand, optionally search up to 3 Pokemon Tool cards.
    if (JUST_EVOLVED(effect, this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      if (player.deck.cards.length === 0) {
        return state;
      }

      return CONFIRMATION_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }

        const toolFilter = { superType: SuperType.TRAINER, trainerType: TrainerType.TOOL };

        SEARCH_DECK_FOR_CARDS_TO_HAND(
          store, state, player, this, toolFilter,
          { min: 0, max: 3, allowCancel: true }
        );
      });
    }

    // Triple Whip: flip 3 coins, 70 damage for each heads.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      effect.damage = 0;

      return MULTIPLE_COIN_FLIPS_PROMPT(store, state, effect.player, 3, results => {
        const heads = results.filter(result => result).length;

        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, heads * 70);
      });
    }

    return state;
  }
}
