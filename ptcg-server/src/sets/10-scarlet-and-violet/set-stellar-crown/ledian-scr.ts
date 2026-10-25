import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  IS_ABILITY_BLOCKED, JUST_EVOLVED, SWITCH_IN_OPPONENT_BENCHED_POKEMON, WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';
import { THIS_ATTACKS_DAMAGE_ISNT_AFFECTED_BY_EFFECTS } from '../../../game/store/prefabs/attack-effects';

export class Ledian extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Ledyba';
  public cardType: CardType[] = [G];
  public hp: number = 90;
  public weakness = [{ type: R }];
  public retreat: CardType[] = [];

  public powers = [{
    name: 'Glittering Star Pattern',
    powerType: PowerType.ABILITY,
    text: 'When you play this Pokémon from your hand to evolve 1 of your Pokémon during your turn, you may switch in 1 of your opponent\'s Benched Pokémon that has 90 HP or less remaining to the Active Spot.',
  }];

  public attacks = [{
    name: 'Swift',
    cost: [C, C],
    damage: 70,
    text: 'This attack\'s damage isn\'t affected by Weakness or Resistance, or by any effects on your opponent\'s Active Pokémon.',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '3';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Ledian';
  public fullName: string = 'Ledian SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Swift: Weakness, Resistance and effects on the opponent's Active Pokémon are ignored.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      THIS_ATTACKS_DAMAGE_ISNT_AFFECTED_BY_EFFECTS(store, state, effect, 70);
    }

    // Glittering Star Pattern: triggered when this Pokémon evolves a Pokémon from hand.
    if (JUST_EVOLVED(effect, this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      const opponent = StateUtils.getOpponent(state, player);
      const hasBenched = opponent.bench.some(slot => slot.cards.length > 0);

      if (hasBenched) {
        state = SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, player);
      }
    }

    return state;
  }
}
