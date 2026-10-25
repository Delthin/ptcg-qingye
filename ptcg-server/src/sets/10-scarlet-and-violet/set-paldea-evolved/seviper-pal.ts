import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Seviper extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 110;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Sharp Fang',
      cost: [C],
      damage: 20,
      text: '',
    },
    {
      name: 'Cross-Cut',
      cost: [D, C],
      damage: 50,
      damageCalculation: '+',
      text: 'If your opponent\'s Active Pokémon is an Evolution Pokémon, this attack does 50 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '137';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Seviper';
  public fullName: string = 'Seviper PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const opponentActive = effect.opponent.active.getPokemonCard();

      if (opponentActive !== undefined
        && opponentActive.stage !== Stage.BASIC
        && opponentActive.stage !== Stage.RESTORED) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 50);
      }
    }

    return state;
  }
}
