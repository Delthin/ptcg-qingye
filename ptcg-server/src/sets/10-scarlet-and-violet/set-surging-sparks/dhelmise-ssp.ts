import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage, SuperType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  MOVE_CARDS,
  SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Dhelmise extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Rescue Kedge',
      cost: [C],
      damage: 0,
      text: 'Put up to 2 Pokémon from your discard pile into your hand.',
    },
    {
      name: 'Annihilating Anchor',
      cost: [G, C, C],
      damage: 80,
      text: 'Before doing damage, discard all Pokémon Tools from your opponent\'s Active Pokémon.',
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '10';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Dhelmise';
  public fullName: string = 'Dhelmise SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Rescue Kedge: put up to 2 Pokémon from your discard pile into your hand.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND(
        store,
        state,
        effect.player,
        this,
        { superType: SuperType.POKEMON },
        { min: 0, max: 2 }
      );
    }

    // Annihilating Anchor: before doing damage, discard all Pokémon Tools from
    // the opponent's Active Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const opponent = effect.opponent;
      const tools = opponent.active.tools.slice();

      if (tools.length > 0) {
        state = MOVE_CARDS(store, state, opponent.active, opponent.discard, { cards: tools });
      }
    }

    return state;
  }
}
