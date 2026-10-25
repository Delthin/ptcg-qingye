import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, SWITCH_ACTIVE_WITH_BENCHED, THIS_ATTACK_DOES_X_MORE_DAMAGE } from '../../../game/store/prefabs/prefabs';

export class Lokix extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Nymble';
  public cardType: CardType[] = [D];
  public hp: number = 120;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Bounce',
      cost: [D],
      damage: 30,
      text: 'Switch this Pokémon with 1 of your Benched Pokémon.',
    },
    {
      name: 'Punishing Kick',
      cost: [D, D],
      damage: 10,
      damageCalculation: '+',
      text: 'This attack does 40 more damage for each damage counter on your opponent\'s Active Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '122';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lokix';
  public fullName: string = 'Lokix PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Bounce: Switch this Pokémon with 1 of your Benched Pokémon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      SWITCH_ACTIVE_WITH_BENCHED(store, state, player);
    }

    // Punishing Kick: 40 more damage for each damage counter on the opponent's Active Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const opponentActive = effect.opponent.active;
      const damageCounters = Math.floor(opponentActive.damage / 10);
      if (damageCounters > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, damageCounters * 40);
      }
    }

    return state;
  }
}
