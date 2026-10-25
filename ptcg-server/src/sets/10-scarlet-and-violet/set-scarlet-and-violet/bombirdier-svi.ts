import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { CardType, Stage, TrainerType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_DECK_FOR_CARDS_TO_HAND, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Bombirdier extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 110;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Knickknack Carrying',
      cost: [C],
      damage: 0,
      text: 'Search your deck for up to 3 Pokémon Tool cards, reveal them, and put them into your hand. Then, shuffle your deck.',
    },
    {
      name: 'Clutch',
      cost: [D, C],
      damage: 60,
      text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '138';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Bombirdier';
  public fullName: string = 'Bombirdier SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const toolFilter: Partial<TrainerCard> = { trainerType: TrainerType.TOOL };

      SEARCH_DECK_FOR_CARDS_TO_HAND(
        store,
        state,
        player,
        this,
        toolFilter,
        { min: 0, max: 3, allowCancel: true },
        effect,
      );
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = BLOCK_RETREAT(store, state, effect, this);
    }

    return state;
  }
}
