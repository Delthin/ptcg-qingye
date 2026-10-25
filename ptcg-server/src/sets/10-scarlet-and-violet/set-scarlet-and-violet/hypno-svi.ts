import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { COPY_OPPONENT_ACTIVE_ATTACK } from '../../../game/store/prefabs/attack-effects';

export class Hypno extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Drowzee';
  public cardType: CardType[] = [P];
  public hp: number = 110;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Pendulum Influence',
      cost: [P],
      damage: 0,
      text: 'Flip a coin. If heads, choose an attack from 1 of your opponent\'s Pokémon in play and use it as this attack.',
    },
    {
      name: 'Psychic Sphere',
      cost: [P, C, C],
      damage: 100,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '83';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Hypno';
  public fullName: string = 'Hypno SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = COIN_FLIP_PROMPT(store, state, effect.player, (result) => {
        if (result) {
          state = COPY_OPPONENT_ACTIVE_ATTACK(store, state, effect);
        }
      });
    }

    return state;
  }
}
