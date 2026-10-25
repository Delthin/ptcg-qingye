import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SHOW_CARDS_TO_PLAYER, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Yanma extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 60;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Silent Wing',
      cost: [G, C],
      damage: 20,
      text: 'Your opponent reveals their hand.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '185';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Yanma';
  public fullName: string = 'Yanma SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      // Your opponent reveals their hand.
      const opponent = effect.opponent;
      state = SHOW_CARDS_TO_PLAYER(store, state, effect.player, opponent.hand.cards);
    }
    return state;
  }
}
