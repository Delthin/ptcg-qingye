import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType } from '../../../game/store/card/card-types';
import { GameMessage, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import { MOVE_CARDS, SHOW_CARDS_TO_PLAYER, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Lickitung extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 100;
  public weakness = [{ type: F }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Tongue Pull',
      cost: [C],
      damage: 0,
      text: 'Your opponent reveals their hand. Put up to 2 Basic Pokémon you find there onto your opponent\'s Bench.',
    },
    {
      name: 'Strength',
      cost: [C, C, C],
      damage: 50,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '124';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lickitung';
  public fullName: string = 'Lickitung TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      const basicsInHand = opponent.hand.cards.filter(
        card => card instanceof PokemonCard && card.stage === Stage.BASIC,
      );
      const openSlots = opponent.bench.filter(slot => slot.cards.length === 0);

      if (basicsInHand.length === 0 || openSlots.length === 0) {
        return state;
      }

      // Your opponent reveals their hand.
      state = SHOW_CARDS_TO_PLAYER(store, state, player, opponent.hand.cards);

      const max = Math.min(2, basicsInHand.length, openSlots.length);

      state = store.prompt(
        state,
        new ChooseCardsPrompt(
          player,
          GameMessage.CHOOSE_CARD_TO_DECK,
          opponent.hand,
          { superType: SuperType.POKEMON, stage: Stage.BASIC },
          { min: 0, max, allowCancel: false },
        ),
        selected => {
          selected.forEach(card => {
            const slot = opponent.bench.find(s => s.cards.length === 0);
            if (slot === undefined) {
              return;
            }
            state = MOVE_CARDS(store, state, opponent.hand, slot, { cards: [card] });
          });
        },
      ) ?? state;
    }

    return state;
  }
}
