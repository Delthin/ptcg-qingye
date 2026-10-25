import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_SLEEP_TO_PLAYER_ACTIVE,
  CONFIRMATION_PROMPT,
  IS_ABILITY_BLOCKED,
  JUST_EVOLVED,
} from '../../../game/store/prefabs/prefabs';

export class Hypno extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Drowzee';
  public cardType: CardType[] = [P];
  public hp: number = 110;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public powers = [{
    name: 'Here for Hypnosis',
    powerType: PowerType.ABILITY,
    text: 'When you play this Pokémon from your hand to evolve 1 of your Pokémon during your turn, you may make your opponent\'s Active Pokémon Asleep.'
  }];

  public attacks = [{
    name: 'Super Psy Bolt',
    cost: [P, P, C],
    damage: 110,
    text: ''
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '97';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Hypno';
  public fullName: string = 'Hypno MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (JUST_EVOLVED(effect, this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      const opponent = StateUtils.getOpponent(state, player);

      state = CONFIRMATION_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }
        ADD_SLEEP_TO_PLAYER_ACTIVE(store, state, opponent, this);
      });
    }

    return state;
  }
}
