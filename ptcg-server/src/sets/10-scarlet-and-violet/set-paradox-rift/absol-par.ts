import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { GameMessage, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import {
  DRAW_CARDS, MOVE_CARDS, THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Absol extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 100;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Drawareness',
      cost: [C],
      damage: 0,
      text: 'You may discard any number of cards from your hand until you have 4 or fewer. Draw cards until you have 5 cards in your hand.',
    },
    {
      name: 'Enhanced Blade',
      cost: [C, C],
      damage: 20,
      damageCalculation: '+',
      text: 'If this Pokémon has a Pokémon Tool attached, this attack does 60 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '113';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Absol';
  public fullName: string = 'Absol PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Drawareness: discard any number of cards from hand down to 4, then draw until 5 cards in hand.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const maxDiscard = Math.max(0, player.hand.cards.length - 4);

      const drawUpToFive = () => {
        const drawCount = Math.max(0, 5 - player.hand.cards.length);
        DRAW_CARDS(store, state, player, drawCount);
      };

      // Hand already has 4 or fewer cards: nothing to discard, just draw.
      if (maxDiscard === 0) {
        drawUpToFive();
        return state;
      }

      state = store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_DISCARD,
        player.hand,
        {},
        { min: 0, max: maxDiscard, allowCancel: false },
      ), cards => {
        if (cards && cards.length > 0) {
          MOVE_CARDS(store, state, player.hand, player.discard, { cards });
        }
        drawUpToFive();
      }) ?? state;
    }

    // Enhanced Blade: +60 damage if this Pokémon has a Pokémon Tool attached.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      if (effect.source.tools.length > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 60);
      }
    }

    return state;
  }
}
