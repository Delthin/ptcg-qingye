import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DISCARD_TOP_X_OF_OPPONENTS_DECK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Kingler extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Krabby';
  public cardType: CardType[] = [W];
  public hp: number = 140;
  public weakness = [{ type: L }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Hammer Arm',
      cost: [W, W, W],
      damage: 90,
      text: 'Discard the top card of your opponent\'s deck.',
    },
    {
      name: 'Guillotine',
      cost: [W, W, W, W],
      damage: 220,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '99';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Kingler';
  public fullName: string = 'Kingler MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      if (effect.opponent.deck.cards.length > 0) {
        DISCARD_TOP_X_OF_OPPONENTS_DECK(store, state, player, 1, this, effect);
      }
    }
    return state;
  }
}
