import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, EnergyType, Stage, SuperType } from '../../../game/store/card/card-types';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { GameMessage, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import { SHUFFLE_CARDS_INTO_DECK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Dialga extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [M];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Reversed Clock',
      cost: [C],
      damage: 0,
      text: 'Shuffle up to 3 in any combination of Pokémon and Basic Energy cards from your discard pile into your deck.',
    },
    {
      name: 'Heavy Impact',
      cost: [M, M, C],
      damage: 110,
      text: '',
    },
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '103';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Dialga';
  public fullName: string = 'Dialga 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Reversed Clock: shuffle up to 3 Pokemon and/or Basic Energy cards from the discard pile into the deck.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const selected: (PokemonCard | EnergyCard)[] = [];

      const pokemonInDiscard = player.discard.cards
        .filter((card): card is PokemonCard => card instanceof PokemonCard);

      const basicEnergyInDiscard = player.discard.cards
        .filter((card): card is EnergyCard =>
          card instanceof EnergyCard && card.energyType === EnergyType.BASIC);

      if (pokemonInDiscard.length === 0 && basicEnergyInDiscard.length === 0) {
        return state;
      }

      const shuffleSelected = (current: State): void => {
        if (selected.length > 0) {
          SHUFFLE_CARDS_INTO_DECK(store, current, player, selected);
        }
      };

      const chooseBasicEnergy = (current: State): State => {
        const remaining = 3 - selected.length;

        if (remaining <= 0 || basicEnergyInDiscard.length === 0) {
          shuffleSelected(current);
          return current;
        }

        return store.prompt(current, new ChooseCardsPrompt(
          player,
          GameMessage.CHOOSE_CARD_TO_DECK,
          player.discard,
          { superType: SuperType.ENERGY },
          { min: 0, max: Math.min(remaining, basicEnergyInDiscard.length), allowCancel: false },
        ), cards => {
          (cards || [])
            .filter((card): card is EnergyCard =>
              card instanceof EnergyCard && card.energyType === EnergyType.BASIC)
            .forEach(card => selected.push(card));
          shuffleSelected(current);
        }) ?? current;
      };

      if (pokemonInDiscard.length === 0) {
        return chooseBasicEnergy(state);
      }

      return store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_DECK,
        player.discard,
        { superType: SuperType.POKEMON },
        { min: 0, max: Math.min(3, pokemonInDiscard.length), allowCancel: false },
      ), cards => {
        (cards || [])
          .filter((card): card is PokemonCard => card instanceof PokemonCard)
          .forEach(card => selected.push(card));
        chooseBasicEnergy(state);
      }) ?? state;
    }

    return state;
  }
}
