import { CardType, PokemonCard, Stage, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Sandslash extends PokemonCard {

  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Sandshrew';

  public cardType: CardType[] = [F];

  public hp: number = 120;

  public weakness = [{ type: G }];

  public retreat = [C, C];

  public attacks = [
    {
      name: 'Rumble',
      cost: [F],
      damage: 30,
      text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.',
    },
    {
      name: 'Spike Rend',
      cost: [F, C, C],
      damage: 80,
      damageCalculation: '+',
      text: 'If your opponent\'s Active Pokémon already has any damage counters on it, this attack does 100 more damage.',
    }
  ];

  public regulationMark: string = 'G';

  public set: string = 'MEW';

  public setNumber: string = '28';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Sandslash';

  public fullName: string = 'Sandslash MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Rumble: the Defending Pokémon can't retreat during the opponent's next turn.
    // Ref: set-dragons-majesty/zygarde.ts (Rumble -> BLOCK_RETREAT)
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return BLOCK_RETREAT(store, state, effect, this);
    }

    // Spike Rend: +100 damage if the opponent's Active Pokémon already has damage counters.
    // Ref: set-silver-tempest/talonflame.ts (Merciless Strike - opponent's Active damage check)
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      if (opponent.active.damage > 0) {
        effect.damage += 100;
      }
    }

    return state;
  }
}
