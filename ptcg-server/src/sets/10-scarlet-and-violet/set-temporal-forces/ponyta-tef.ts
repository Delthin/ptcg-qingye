import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { CardType, EnergyType, Stage, SuperType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_DECK_FOR_CARDS_TO_HAND, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

const BASIC_ENERGY_FILTER: Partial<EnergyCard> = {
  superType: SuperType.ENERGY,
  energyType: EnergyType.BASIC,
};

export class Ponyta extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 70;
  public weakness = [{ type: W }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Charge Energy',
      cost: [C],
      damage: 0,
      text: 'Search your deck for a Basic Energy card, reveal it, and put it into your hand. Then, shuffle your deck.',
    },
    {
      name: 'Flame Tail',
      cost: [R, C],
      damage: 20,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '26';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Ponyta';
  public fullName: string = 'Ponyta TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const hasBasicEnergyInDeck = player.deck.cards.some(card =>
        card instanceof EnergyCard && card.energyType === EnergyType.BASIC);

      if (hasBasicEnergyInDeck) {
        SEARCH_DECK_FOR_CARDS_TO_HAND(store, state, player, this, BASIC_ENERGY_FILTER, {}, effect);
      }
    }

    return state;
  }
}
