import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType } from '../../../game/store/card/card-types';
import { GameMessage, PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import {
  CONFIRMATION_PROMPT, IS_ABILITY_BLOCKED, JUST_EVOLVED, MOVE_CARDS, SHUFFLE_DECK, SHOW_CARDS_TO_PLAYER
} from '../../../game/store/prefabs/prefabs';

export class Thievul extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Nickit';
  public cardType: CardType[] = [D];
  public hp: number = 110;
  public weakness = [{ type: G }];
  public retreat = [C];

  public powers = [{
    name: 'Rob-\'n\'-Run',
    powerType: PowerType.ABILITY,
    text: 'When you play this Pokémon from your hand to evolve 1 of your Pokémon during your turn, ' +
      'you may have your opponent reveal their hand, and then you choose 2 Energy cards you find there ' +
      'and shuffle them into your opponent\'s deck.'
  }];

  public attacks = [
    {
      name: 'Claw Slash',
      cost: [C, C],
      damage: 60,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '120';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Thievul';
  public fullName: string = 'Thievul PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (JUST_EVOLVED(effect, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      // Ability that triggers on evolving into this Pokémon
      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      const energyInHand = opponent.hand.cards.filter(card => card.superType === SuperType.ENERGY);

      // Nothing to choose if the opponent has no Energy in hand
      if (energyInHand.length === 0) {
        return state;
      }

      const count = Math.min(2, energyInHand.length);

      state = CONFIRMATION_PROMPT(store, state, player, wantsToUse => {
        if (!wantsToUse) {
          return;
        }

        // Opponent reveals their hand to this player
        state = SHOW_CARDS_TO_PLAYER(store, state, player, opponent.hand.cards);

        const promptState = store.prompt(state, new ChooseCardsPrompt(
          player,
          GameMessage.CHOOSE_CARD_TO_DECK,
          opponent.hand,
          { superType: SuperType.ENERGY },
          { min: count, max: count, allowCancel: false },
        ), cards => {
          if (!cards || cards.length === 0) {
            return;
          }

          state = MOVE_CARDS(store, state, opponent.hand, opponent.deck, {
            cards: cards,
            sourceCard: this,
            sourceEffect: effect,
          });
          state = SHUFFLE_DECK(store, state, opponent);
        });

        state = promptState ?? state;
      });
    }

    return state;
  }
}
