import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Floatzel extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Buizel';
  public cardType: CardType[] = [W];
  public hp: number = 110;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Swirling Tail',
      cost: [W],
      damage: 0,
      text: 'Flip a coin. If heads, put your opponent\'s Active Pokémon and all attached cards into your opponent\'s hand.',
    },
    {
      name: 'Waterfall',
      cost: [W, C],
      damage: 60,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '49';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Floatzel';
  public fullName: string = 'Floatzel OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      let heads = false;
      state = COIN_FLIP_PROMPT(store, state, player, result => {
        heads = result;
      });

      if (heads && opponent.active.cards.length > 0) {
        const cards = opponent.active.cards.slice();
        state = MOVE_CARDS(store, state, opponent.active, opponent.hand, { cards });
      }
    }
    return state;
  }
}
