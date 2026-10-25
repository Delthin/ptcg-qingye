import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckAttackCostEffect } from '../../../game/store/effects/check-effects';
import { IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED } from '../../../game/store/prefabs/attack-effects';

export class Noivern extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Noibat';
  public cardType: CardType[] = [C];
  public hp: number = 110;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat: CardType[] = [];

  public powers = [{
    name: 'Tuning Echo',
    powerType: PowerType.ABILITY,
    text: 'If you have the same number of cards in your hand as your opponent, ignore all Energy in the cost of Frightening Howl used by this Pokémon.'
  }];

  public attacks = [{
    name: 'Frightening Howl',
    cost: [C, C, C],
    damage: 110,
    text: 'Your opponent\'s Active Pokémon is now Confused.'
  }];

  public regulationMark = 'I';
  public set: string = 'JTG';
  public setNumber: string = '128';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Noivern';
  public fullName: string = 'Noivern JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Tuning Echo: if hand sizes are equal, ignore all Energy in Frightening Howl's cost.
    if (effect instanceof CheckAttackCostEffect) {
      const player = effect.player;

      if (player.active.getPokemonCard() !== this) {
        return state;
      }

      if (effect.attack.name !== 'Frightening Howl') {
        return state;
      }

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      const opponent = StateUtils.getOpponent(state, player);
      if (player.hand.cards.length !== opponent.hand.cards.length) {
        return state;
      }

      effect.cost = [];
      return state;
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
    }

    return state;
  }
}
