import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { CardType, Stage, SuperType } from '../../../game/store/card/card-types';
import { PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_ENERGY_PROMPT,
  HEAL_X_DAMAGE_FROM_THIS_POKEMON,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Snorlax extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 160;
  public weakness = [{ type: F }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'But First, Food',
      cost: [C],
      damage: 0,
      text: 'Attach an Energy card from your hand to this Pokémon. If you do, heal 60 damage from this Pokémon.'
    },
    {
      name: 'Heavy Impact',
      cost: [C, C, C, C, C],
      damage: 160,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '136';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Snorlax';
  public fullName: string = 'Snorlax TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const hasEnergyInHand = player.hand.cards.some(card => card instanceof EnergyCard);

      if (hasEnergyInHand) {
        state = ATTACH_ENERGY_PROMPT(
          store,
          state,
          player,
          PlayerType.BOTTOM_PLAYER,
          SlotType.HAND,
          [SlotType.ACTIVE],
          { superType: SuperType.ENERGY }
        );

        HEAL_X_DAMAGE_FROM_THIS_POKEMON(effect, store, state, 60);
      }
    }

    return state;
  }
}
