import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Card } from '../../../game/store/card/card';
import { Stage, CardType, SuperType, EnergyType } from '../../../game/store/card/card-types';
import { GameMessage, StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import { MOVE_CARDS, SHUFFLE_DECK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Bruxish extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 100;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Vivid Charge',
      cost: [W],
      damage: 0,
      text: 'Search your deck for up to 3 Basic Energy cards, reveal them, and put them into your hand. Then, shuffle your deck.',
    },
    {
      name: 'Wave Splash',
      cost: [W, C],
      damage: 60,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '51';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Bruxish';
  public fullName: string = 'Bruxish SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      if (player.deck.cards.length === 0) {
        return state;
      }

      const filter: Partial<Card> & { superType?: SuperType; energyType?: EnergyType } = {
        superType: SuperType.ENERGY,
        energyType: EnergyType.BASIC,
      };

      return store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_HAND,
        player.deck,
        filter,
        { min: 0, max: 3, allowCancel: false },
      ), cards => {
        cards = cards || [];

        if (cards.length > 0) {
          MOVE_CARDS(store, state, player.deck, player.hand, { cards });
        }

        SHUFFLE_DECK(store, state, player);
      }) ?? state;
    }

    return state;
  }
}
