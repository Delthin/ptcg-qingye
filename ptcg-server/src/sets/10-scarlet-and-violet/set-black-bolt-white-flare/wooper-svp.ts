import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Card } from '../../../game/store/card/card';
import { CardType, EnergyType, Stage, SuperType } from '../../../game/store/card/card-types';
import { GameMessage, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import { MOVE_CARDS, SHUFFLE_DECK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Wooper extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 60;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Scoop Water',
      cost: [W],
      damage: 0,
      text: 'Shuffle up to 3 Basic [W] Energy cards from your discard pile into your deck.',
    },
    {
      name: 'Headbutt',
      cost: [W],
      damage: 10,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '155';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Wooper';
  public fullName: string = 'Wooper SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_DECK,
        player.discard,
        {
          superType: SuperType.ENERGY,
          energyType: EnergyType.BASIC,
          provides: [CardType.WATER],
        } as Partial<Card>,
        { min: 0, max: 3, allowCancel: false }
      ), cards => {
        if (cards && cards.length > 0) {
          state = MOVE_CARDS(store, state, player.discard, player.deck, { cards });
          state = SHUFFLE_DECK(store, state, player);
        }
      }) ?? state;
    }

    return state;
  }
}
