import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  DAMAGE_OPPONENT_POKEMON,
  SWITCH_IN_OPPONENT_BENCHED_POKEMON,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Mawile extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [M];
  public hp: number = 90;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Invite and Strike',
      cost: [C, C],
      damage: 0,
      text: 'Switch in 1 of your opponent\'s Benched Pokémon to the Active Spot. This attack does 30 damage to the new Active Pokémon.',
    },
    {
      name: 'Sharp Fang',
      cost: [M, M, C],
      damage: 100,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '112';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mawile';
  public fullName: string = 'Mawile TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      // No Benched Pokémon to switch in: the attack does nothing.
      const benched = opponent.bench.filter(b => b.cards.length > 0);
      if (benched.length === 0) {
        return state;
      }

      state = SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, player);

      if (opponent.active.cards.length > 0) {
        DAMAGE_OPPONENT_POKEMON(store, state, effect, 30, [opponent.active]);
      }
    }

    return state;
  }
}
