import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Pinsir extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 120;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Vise Grip',
      cost: [G, C],
      damage: 30,
      text: '',
    },
    {
      name: 'Reckless Throw',
      cost: [G, G, C],
      damage: 90,
      damageCalculation: '+',
      text: 'If you have more Prize cards remaining than your opponent, this attack does 90 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '127';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pinsir';
  public fullName: string = 'Pinsir MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      // If you have more Prize cards remaining than your opponent, this attack does 90 more damage.
      if (player.getPrizeLeft() > opponent.getPrizeLeft()) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 90);
      }
    }

    return state;
  }
}
