import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckAttackCostEffect } from '../../../game/store/effects/check-effects';

export class Veluza extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 130;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Ram',
      cost: [W],
      damage: 20,
      text: ''
    },
    {
      name: 'Slim Screw',
      cost: [W, C, C, C],
      damage: 120,
      text: 'If you have no cards in your hand, this attack can be used for Water.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '56';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Veluza';
  public fullName: string = 'Veluza PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Slim Screw: if you have no cards in your hand, its cost is a single [W] Energy.
    if (effect instanceof CheckAttackCostEffect && effect.attack === this.attacks[1]) {
      const player = effect.player;

      if (player.hand.cards.length === 0) {
        effect.cost = [W];
      }
    }

    return state;
  }
}
