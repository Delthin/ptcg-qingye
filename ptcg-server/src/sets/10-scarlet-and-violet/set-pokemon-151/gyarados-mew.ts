import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON } from '../../../game/store/prefabs/attack-effects';
import {
  DISCARD_TOP_X_CARDS_FROM_YOUR_DECK,
  IS_ABILITY_BLOCKED,
  JUST_EVOLVED,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Gyarados extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Magikarp';
  public cardType: CardType[] = [W];
  public hp: number = 190;
  public weakness = [{ type: L }];
  public retreat = [C, C, C, C];

  public powers = [{
    name: 'Untamed One',
    powerType: PowerType.ABILITY,
    text: 'When you play this Pokémon from your hand to evolve 1 of your Pokémon during your turn, you must discard the top 5 cards of your deck.',
  }];

  public attacks = [{
    name: 'Hyper Beam',
    cost: [W, C, C, C],
    damage: 200,
    text: 'Discard an Energy from your opponent\'s Active Pokémon.',
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '130';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Gyarados';
  public fullName: string = 'Gyarados MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Untamed One: on evolving into this Pokémon, discard the top 5 cards of your deck.
    if (JUST_EVOLVED(effect, this)) {
      const player = effect.player;

      if (!IS_ABILITY_BLOCKED(store, state, player, this)) {
        state = DISCARD_TOP_X_CARDS_FROM_YOUR_DECK(store, state, player, 5, this, effect);
      }
    }

    // Hyper Beam: discard an Energy from your opponent's Active Pokémon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON(store, state, effect);
    }

    return state;
  }
}
