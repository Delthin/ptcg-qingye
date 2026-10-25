import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, TrainerType } from '../../../game/store/card/card-types';
import { GameMessage, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import { MOVE_CARDS, SHOW_CARDS_TO_PLAYER, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Greavard extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 80;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Underworld Stroll',
      cost: [C, C],
      damage: 0,
      text: 'Your opponent reveals their hand. Choose a Supporter card you find there and put it on the bottom of their deck.'
    },
    {
      name: 'Sharp Fang',
      cost: [P, C, C],
      damage: 30,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '105';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Greavard';
  public fullName: string = 'Greavard SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      const supportersInHand = opponent.hand.cards.filter(card =>
        card instanceof TrainerCard && card.trainerType === TrainerType.SUPPORTER);

      // Your opponent reveals their hand.
      state = SHOW_CARDS_TO_PLAYER(store, state, player, opponent.hand.cards);

      if (supportersInHand.length === 0) {
        return state;
      }

      // Choose a Supporter card you find there and put it on the bottom of their deck.
      state = store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_DECK,
        opponent.hand,
        { trainerType: TrainerType.SUPPORTER },
        { min: 1, max: 1, allowCancel: false }
      ), selected => {
        const chosen = selected || [];
        if (chosen.length > 0) {
          state = MOVE_CARDS(store, state, opponent.hand, opponent.deck, { cards: chosen, toBottom: true });
        }
        return state;
      }) ?? state;
    }

    return state;
  }
}
