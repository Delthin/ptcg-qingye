import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SHOW_CARDS_TO_PLAYER, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Drowzee extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 70;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Eerie Gaze',
    cost: [P],
    damage: 10,
    text: 'Your opponent reveals their hand.',
  }];

  public regulationMark = 'H';
  public set: string = 'SFA';
  public setNumber: string = '16';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Drowzee';
  public fullName: string = 'Drowzee SFA';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;

      if (opponent.hand.cards.length === 0) {
        return state;
      }

      return SHOW_CARDS_TO_PLAYER(store, state, effect.player, opponent.hand.cards);
    }

    return state;
  }
}
