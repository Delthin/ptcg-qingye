import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  WAS_ATTACK_USED,
  WAS_POKEMON_KNOCKED_OUT_DURING_OPPONENTS_LAST_TURN,
  THIS_ATTACK_DOES_X_MORE_DAMAGE
} from '../../../game/store/prefabs/prefabs';
import { FLIP_A_COIN_UNTIL_YOU_GET_TAILS_DO_X_DAMAGE_PER_HEADS } from '../../../game/store/prefabs/attack-effects';

export class Revavroom extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Varoom';
  public cardType: CardType[] = [M];
  public hp: number = 140;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Rally Back',
      cost: [C],
      damage: 30,
      damageCalculation: '+',
      text: 'If any of your Pokémon were Knocked Out by damage from an attack during your opponent\'s last turn, this attack does 90 more damage.',
    },
    {
      name: 'Running Charge',
      cost: [M, C, C],
      damage: 100,
      damageCalculation: 'x',
      text: 'Flip a coin until you get tails. This attack does 100 damage for each heads.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '125';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Revavroom';
  public fullName: string = 'Revavroom TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      if (WAS_POKEMON_KNOCKED_OUT_DURING_OPPONENTS_LAST_TURN(player)) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 90);
      }
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = FLIP_A_COIN_UNTIL_YOU_GET_TAILS_DO_X_DAMAGE_PER_HEADS(store, state, effect, 100);
    }

    return state;
  }
}
