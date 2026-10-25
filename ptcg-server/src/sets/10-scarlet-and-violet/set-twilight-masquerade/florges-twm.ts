import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_CONFUSION_TO_PLAYER_ACTIVE, COIN_FLIP_PROMPT, IS_ABILITY_BLOCKED,
  SWITCH_IN_OPPONENT_BENCHED_POKEMON, USE_ABILITY_ONCE_PER_TURN, WAS_POWER_USED,
} from '../../../game/store/prefabs/prefabs';

export class Florges extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Floette';
  public cardType: CardType[] = [P];
  public hp: number = 140;
  public weakness = [{ type: M }];
  public retreat = [C, C];

  public powers = [{
    name: 'Captivating Invitation',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, you may flip a coin. If heads, switch in 1 of your opponent\'s Benched Pokémon to the Active Spot, and the new Active Pokémon is now Confused.',
  }];

  public attacks = [{
    name: 'Magical Shot',
    cost: [P, C],
    damage: 120,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '88';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Florges';
  public fullName: string = 'Florges TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      USE_ABILITY_ONCE_PER_TURN(player, 'CAPTIVATING_INVITATION', this);

      COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }

        // No Benched Pokémon means nothing is switched in, so no Confusion either.
        const benched = opponent.bench.filter(b => b.cards.length > 0);
        if (benched.length === 0) {
          return;
        }

        state = SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, player);
        ADD_CONFUSION_TO_PLAYER_ACTIVE(store, state, opponent, this);
      });
    }

    return state;
  }
}
