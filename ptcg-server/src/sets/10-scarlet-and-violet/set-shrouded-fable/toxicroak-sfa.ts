import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, THIS_ATTACK_DOES_X_MORE_DAMAGE } from '../../../game/store/prefabs/prefabs';

export class Toxicroak extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Croagunk';
  public cardType: CardType[] = [F];
  public hp: number = 130;
  public weakness = [{ type: P }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Corkscrew Punch',
      cost: [C, C],
      damage: 50,
      text: ''
    },
    {
      name: 'Clean Hit',
      cost: [F, C, C],
      damage: 90,
      damageCalculation: '+',
      text: 'If your opponent\'s Active Pokémon is an Evolution Pokémon, this attack does 90 more damage.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SFA';
  public setNumber: string = '24';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Toxicroak';
  public fullName: string = 'Toxicroak SFA';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const opponentActive = effect.opponent.active.getPokemonCard();
      if (opponentActive !== undefined && opponentActive.stage !== Stage.BASIC) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 90);
      }
    }
    return state;
  }
}
