import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType, SuperType } from '../../../game/store/card/card-types';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { GameMessage, PlayerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import { MOVE_CARDS, SHUFFLE_DECK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Articuno extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 110;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Frigid Fluttering',
      cost: [C],
      damage: 0,
      text: 'Search your deck for up to 2 Basic Water Energy cards and attach them to this Pokémon. Then, shuffle your deck.',
    },
    {
      name: 'Ice Blast',
      cost: [W, W, C],
      damage: 110,
      text: '',
    },
  ];

  public regulationMark = 'I';
  public set: string = 'JTG';
  public setNumber: string = '32';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Articuno';
  public fullName: string = 'Articuno JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      if (player.deck.cards.length === 0) {
        return state;
      }

      // The Energy has to be attached to this Pokemon, so locate its slot.
      let pokemonSlot = player.active;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        if (cardList.getPokemonCard() === this) {
          pokemonSlot = cardList;
        }
      });

      // `blocked` is a list of card indexes that cannot be chosen.
      // Only Basic Water Energy cards may be searched out.
      const blocked: number[] = [];
      player.deck.cards.forEach((card, index) => {
        const isBasicWater = card instanceof EnergyCard
          && card.energyType === EnergyType.BASIC
          && card.provides.includes(CardType.WATER);

        if (!isBasicWater) {
          blocked.push(index);
        }
      });

      state = store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_HAND,
        player.deck,
        { superType: SuperType.ENERGY },
        { min: 0, max: 2, allowCancel: false, blocked: blocked }
      ), cards => {
        const selected = cards || [];

        if (selected.length > 0) {
          state = MOVE_CARDS(store, state, player.deck, pokemonSlot, { cards: selected });
        }

        state = SHUFFLE_DECK(store, state, player);
      }) ?? state;
    }

    return state;
  }
}
