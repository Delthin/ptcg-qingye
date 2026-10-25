import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { CardType, Stage, SuperType, TrainerType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_DECK_FOR_CARDS_TO_HAND, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class PaldeanWooper extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 60;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Find a Home',
      cost: [C],
      damage: 0,
      text: 'Search your deck for a Stadium card, reveal it, and put it into your hand. Then, shuffle your deck.',
    },
    {
      name: 'Ram',
      cost: [D],
      damage: 10,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '128';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Paldean Wooper';
  public fullName: string = 'Paldean Wooper PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const stadiumFilter: Partial<TrainerCard> = {
        superType: SuperType.TRAINER,
        trainerType: TrainerType.STADIUM,
      };

      SEARCH_DECK_FOR_CARDS_TO_HAND(
        store,
        state,
        player,
        this,
        stadiumFilter,
        { allowCancel: false, min: 1, max: 1 },
      );
    }

    return state;
  }
}
