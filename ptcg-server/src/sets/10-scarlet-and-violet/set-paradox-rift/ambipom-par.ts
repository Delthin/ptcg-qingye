import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Ambipom extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Aipom';
  public cardType: CardType[] = [C];
  public hp: number = 100;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Collect',
      cost: [C],
      damage: 0,
      text: 'Draw 2 cards.',
    },
    {
      name: 'Hand Fling',
      cost: [C, C, C],
      damage: 20,
      damageCalculation: 'x',
      text: 'This attack does 20 damage for each card in your hand.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '146';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Ambipom';
  public fullName: string = 'Ambipom PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DRAW_CARDS(store, state, effect.player, 2);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      effect.damage = effect.player.hand.cards.length * 20;
    }

    return state;
  }
}
