import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State, StateUtils } from '../../../game';

import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Rattata extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.COLORLESS];
  public hp: number = 40;
  public weakness = [{ type: CardType.FIGHTING }];
  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Gnaw the Wound',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: 20,
      damageCalculation: '+',
      text: 'This attack does 10 more damage for each damage counter on your opponent\'s Active Pokémon.'
    }
  ];

  public regulationMark = 'G';

  public cardImage: string = 'assets/cardback.png';

  public set: string = 'MEW';

  public setNumber: string = '19';

  public name: string = 'Rattata';

  public fullName: string = 'Rattata MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Gnaw the Wound: +10 damage per damage counter on the opponent's Active Pokemon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      effect.damage += opponent.active.damage;
    }

    return state;
  }
}
