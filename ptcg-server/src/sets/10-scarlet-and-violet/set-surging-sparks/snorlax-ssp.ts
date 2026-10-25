import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Snorlax extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 150;
  public weakness = [{ type: F }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Spike Draw',
      cost: [C],
      damage: 20,
      text: 'Draw a card.',
    },
    {
      name: 'Mega Punch',
      cost: [C, C, C],
      damage: 100,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '144';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Snorlax';
  public fullName: string = 'Snorlax SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DRAW_CARDS(store, state, effect.player, 1);
    }

    return state;
  }
}
