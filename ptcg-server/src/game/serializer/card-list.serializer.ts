import { SerializerContext, Serialized, Serializer } from './serializer.interface';
import { CardList } from '../store/state/card-list';
import { Card } from '../store/card/card';
import { SuperType } from '../store/card/card-types';
import { GameError } from '../game-error';
import { GameCoreError } from '../game-message';
import { PokemonCardList } from '../store/state/pokemon-card-list';

export class CardListSerializer implements Serializer<CardList> {

  public readonly types = ['CardList', 'PokemonCardList'];
  public readonly classes = [CardList, PokemonCardList];

  constructor() { }

  public serialize(cardList: CardList): Serialized {
    const data: any = { ...cardList };
    let constructorName = 'CardList';

    if (cardList instanceof PokemonCardList) {
      constructorName = 'PokemonCardList';
      if (cardList.tools.length > 0) {
        data.tool = cardList.tools[0].id;
      }
      if (cardList.showAllStageAbilities !== undefined) {
        data.showAllStageAbilities = cardList.showAllStageAbilities;
      }
    }

    // Include artworksMap if present so clients can resolve custom art
    if ((cardList as any).artworksMap) {
      data.artworksMap = (cardList as any).artworksMap;
    }
    if ((cardList as any).sleeveImagePath) {
      data.sleeveImagePath = (cardList as any).sleeveImagePath;
    }

    // Lists encode cards as numeric IDs, so CardSerializer is NOT invoked for their contents.
    // Keep per-copy appearance alongside visible list entries, not on global cardNames (which
    // would expose hidden deck/prize editions to opponents after state sanitization).
    const cardAppearances = cardList.cards.flatMap(card => card.printingId && card.printingImage
      ? [{ index: card.id, printingId: card.printingId, image: card.printingImage }] : []);
    return {
      ...data,
      ...(cardAppearances.length ? { cardAppearances } : {}),
      _type: constructorName,
      cards: cardList.cards.map(card => card.id)
    };
  }

  public deserialize(data: Serialized, context: SerializerContext): CardList {
    const instance = data._type === 'PokemonCardList'
      ? new PokemonCardList()
      : new CardList();

    delete (data as any)._type;

    const indexes: number[] = data.cards;
    data.cards = indexes.map(index => this.fromIndex(index, context));
    if (Array.isArray(data.cardAppearances)) {
      for (const appearance of data.cardAppearances) {
        if (!indexes.includes(appearance.index)) continue;
        const card = this.fromIndex(appearance.index, context);
        card.printingId = appearance.printingId;
        card.printingImage = appearance.image;
      }
    }
    delete data.cardAppearances;

    // Explicitly handle PokemonCardList properties
    if (instance instanceof PokemonCardList) {
      // If a tool is present, add it only to tools, not to cards
      if (data.tool !== undefined) {
        const toolCard = this.fromIndex(data.tool, context);
        instance.tools.push(toolCard);
      }
      instance.showBasicAnimation = data.showBasicAnimation || false;
      instance.triggerEvolutionAnimation = data.triggerEvolutionAnimation || false;
      instance.triggerAttackAnimation = data.triggerAttackAnimation || false;
    }

    const result = Object.assign(instance, data);

    // Fix superType for Pokemon cards acting as energy (e.g., Holon's cards, Base Set Electrode).
    // These are PokemonCard instances that implement EnergyCard and get attached as energy.
    // The superType mutation doesn't survive serialization since cards are reconstructed
    // fresh from knownCards, so we restore it here based on the energies list.
    if (result instanceof PokemonCardList) {
      result.energies.cards.forEach(card => {
        if (card.superType === SuperType.POKEMON) {
          card.superType = SuperType.ENERGY;
        }
      });
    }

    return result;
  }

  private fromIndex(index: number, context: SerializerContext): Card {
    const card = context.cards[index];
    if (card === undefined) {
      throw new GameError(GameCoreError.ERROR_SERIALIZER, `Card not found on index '${index}'.`);
    }
    return card;
  }

}
