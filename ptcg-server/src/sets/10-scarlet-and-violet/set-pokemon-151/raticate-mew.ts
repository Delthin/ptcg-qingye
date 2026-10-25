import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State, StateUtils } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Raticate extends PokemonCard {

  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Rattata';

  public cardType: CardType[] = [CardType.COLORLESS];

  public hp: number = 70;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat: CardType[] = [];

  public attacks = [
    {
      name: 'Second Bite',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: 30,
      damageCalculation: '+',
      text: 'This attack does 30 more damage for each damage counter on your opponent\'s Active Pokémon.'
    }
  ];

  public regulationMark = 'G';

  public cardImage: string = 'assets/cardback.png';

  public set: string = 'MEW';

  public setNumber: string = '20';

  public name: string = 'Raticate';

  public fullName: string = 'Raticate MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Second Bite: 30 more damage per damage counter on the opponent's Active Pokémon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      const damageCounters = Math.floor(opponent.active.damage / 10);
      effect.damage += damageCounters * 30;
    }

    return state;
  }

}
