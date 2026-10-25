import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SELECT_PROMPT, SHUFFLE_HAND_INTO_DECK_THEN_DRAW, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Farigiraf extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Girafarig';
  public cardType: CardType[] = [C];
  public hp: number = 140;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Either Face',
      cost: [C],
      damage: 0,
      text: 'Choose a player. That player shuffles their hand into their deck and draws 4 cards.'
    },
    {
      name: 'Power Beam',
      cost: [C, C, C],
      damage: 130,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '155';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Farigiraf';
  public fullName: string = 'Farigiraf PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      state = SELECT_PROMPT(store, state, player, ['Yourself', 'Your opponent'], result => {
        const chosen = result === 1 ? opponent : player;
        SHUFFLE_HAND_INTO_DECK_THEN_DRAW(store, state, chosen, { drawCount: 4, sourceCard: this });
      });
    }
    return state;
  }
}
