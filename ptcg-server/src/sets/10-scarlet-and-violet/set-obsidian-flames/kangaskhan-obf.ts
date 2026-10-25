import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Kangaskhan extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 130;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Headbutt',
      cost: [C],
      damage: 30,
      text: '',
    },
    {
      name: 'Spike Draw',
      cost: [C, C],
      damage: 60,
      text: 'Draw 2 cards.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '165';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Kangaskhan';
  public fullName: string = 'Kangaskhan OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      state = DRAW_CARDS(store, state, player, 2);
    }
    return state;
  }
}
