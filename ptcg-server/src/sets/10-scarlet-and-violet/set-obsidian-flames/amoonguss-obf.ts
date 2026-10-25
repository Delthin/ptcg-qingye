import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_PARALYZED_TO_PLAYER_ACTIVE,
  ADD_POISON_TO_PLAYER_ACTIVE,
  COIN_FLIP_PROMPT,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Amoonguss extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Foongus';
  public cardType: CardType[] = [CardType.GRASS];
  public hp: number = 110;
  public weakness = [{ type: CardType.FIRE }];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [{
    name: 'Dangerous Spores',
    cost: [CardType.GRASS, CardType.COLORLESS],
    damage: 60,
    text: 'Flip a coin. If heads, your opponent\'s Active Pokémon is now Paralyzed and Poisoned.'
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '10';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Amoonguss';
  public fullName: string = 'Amoonguss OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }

        ADD_PARALYZED_TO_PLAYER_ACTIVE(store, state, opponent, this);
        ADD_POISON_TO_PLAYER_ACTIVE(store, state, opponent, this);
      });
    }

    return state;
  }
}
