import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, THIS_ATTACK_DOES_X_MORE_DAMAGE } from '../../../game/store/prefabs/prefabs';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class Houndoom extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Houndour';
  public cardType: CardType[] = [D];
  public hp: number = 130;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Daring Strike',
      cost: [D, C],
      damage: 50,
      damageCalculation: '+',
      text: 'If your opponent\'s Active Pokémon is an Evolution Pokémon, this attack does 70 more damage.',
    },
    {
      name: 'Shadow Slash',
      cost: [D, C, C],
      damage: 130,
      text: 'Discard an Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '133';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Houndoom';
  public fullName: string = 'Houndoom OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponentActive = effect.opponent.active.getPokemonCard();
      if (opponentActive !== undefined && opponentActive.stage !== Stage.BASIC) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 70);
      }
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 1, {}, 1);
    }

    return state;
  }
}
