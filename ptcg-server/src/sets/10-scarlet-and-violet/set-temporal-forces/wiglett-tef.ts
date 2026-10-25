import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage, SuperType, TrainerType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  SEARCH_DECK_FOR_CARDS_TO_HAND,
  THIS_POKEMON_DOES_DAMAGE_TO_ITSELF,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Wiglett extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 60;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Lucky Find',
      cost: [W],
      damage: 0,
      text: 'Search your deck for an Item card, reveal it, and put it into your hand. Then, shuffle your deck.',
    },
    {
      name: 'Aqua Bomb',
      cost: [W, W],
      damage: 40,
      text: 'This Pokémon also does 20 damage to itself.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '47';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Wiglett';
  public fullName: string = 'Wiglett TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const itemFilter = { superType: SuperType.TRAINER, trainerType: TrainerType.ITEM };

      SEARCH_DECK_FOR_CARDS_TO_HAND(store, state, player, this, itemFilter, {
        min: 1,
        max: 1,
        allowCancel: true,
      });

      return state;
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 20);
    }

    return state;
  }
}
