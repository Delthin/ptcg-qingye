import type { Card, EnergyCard, PokemonCard, TrainerCard } from 'ptcg-server';
import { cardPrintingKey, canonicalFreePrintingId, CardTag, CardType, EnergyType, getPrimaryCardType, Stage, SuperType, TrainerType } from 'ptcg-server';
import type { DeckSlot } from './types';

export function isBasicEnergy(card: Card): boolean {
  return card.superType === SuperType.ENERGY && (card as EnergyCard).energyType === EnergyType.BASIC;
}

export function getSameNameCount(slots: DeckSlot[], cardName: string): number {
  return slots.filter((i) => i.card.name === cardName).reduce((sum, i) => sum + i.count, 0);
}

export type CanAddResult = { ok: true } | { ok: false; reason: string };

export type AddCardResult = { ok: true; slots: DeckSlot[] } | { ok: false; reason: string };

function compareCardType(cardType: CardType): number {
  const order = [
    CardType.GRASS,
    CardType.FIRE,
    CardType.WATER,
    CardType.LIGHTNING,
    CardType.PSYCHIC,
    CardType.FIGHTING,
    CardType.DARK,
    CardType.METAL,
    CardType.COLORLESS,
    CardType.FAIRY,
    CardType.DRAGON,
  ];
  return order.indexOf(cardType);
}

function compareTrainerType(input: TrainerType): number {
  if (input === TrainerType.SUPPORTER) return 1;
  if (input === TrainerType.ITEM) return 2;
  if (input === TrainerType.TOOL) return 3;
  if (input === TrainerType.STADIUM) return 4;
  return Infinity;
}

function compareEnergyType(input: EnergyType): number {
  if (input === EnergyType.BASIC) return 1;
  if (input === EnergyType.SPECIAL) return 2;
  return Infinity;
}

const STAGE_ORDER = [
  Stage.BASIC,
  Stage.STAGE_1,
  Stage.STAGE_2,
  Stage.VMAX,
  Stage.VSTAR,
  Stage.VUNION,
  Stage.LEGEND,
  Stage.MEGA,
  Stage.BREAK,
  Stage.RESTORED,
  Stage.NONE,
];

/**
 * Order deck slots by type, while keeping evolution lines together:
 * chains sorted by the basic's type (then name), each chain Basic → Stage1 → …,
 * then Trainers, then Energy. Cross-type evolutions (e.g. Psychic Frillish + Water
 * Jellicent) stay in the basic's type group.
 */
export function sortDeckSlots(slots: DeckSlot[]): DeckSlot[] {
  const pokemonCards = slots.filter((d) => d.card.superType === SuperType.POKEMON);
  const trainerCards = slots.filter((d) => d.card.superType === SuperType.TRAINER);
  const energyCards = slots.filter((d) => d.card.superType === SuperType.ENERGY);

  const evolutionChains = new Map<string, DeckSlot[]>();
  const processedCards = new Set<string>();
  const cardNameMap = new Map<string, DeckSlot[]>();

  for (const item of pokemonCards) {
    const pokemonCard = item.card as PokemonCard;
    const name = pokemonCard.name;
    const existing = cardNameMap.get(name);
    if (existing) {
      existing.push(item);
    } else {
      cardNameMap.set(name, [item]);
    }
  }

  const findBasicPokemon = (pokemonCard: PokemonCard, visited: Set<string> = new Set()): string | null => {
    const cardName = pokemonCard.name;
    if (visited.has(cardName)) {
      return null;
    }
    visited.add(cardName);

    if (pokemonCard.stage === Stage.BASIC && !pokemonCard.evolvesFrom) {
      return cardName;
    }

    if (pokemonCard.evolvesFrom) {
      const preEvolutionCards = cardNameMap.get(pokemonCard.evolvesFrom);
      if (preEvolutionCards && preEvolutionCards.length > 0) {
        const preEvoCard = preEvolutionCards[0].card as PokemonCard;
        const basic = findBasicPokemon(preEvoCard, visited);
        if (basic) {
          return basic;
        }
      }
    }

    for (const [name, items] of cardNameMap.entries()) {
      if (name === cardName) continue;
      const otherCard = items[0].card as PokemonCard;
      if (otherCard.evolvesFrom === cardName && pokemonCard.stage === Stage.BASIC) {
        return cardName;
      }
    }

    if (pokemonCard.stage === Stage.BASIC) {
      return cardName;
    }

    return null;
  };

  const addToChain = (item: DeckSlot, chainKey: string): void => {
    const fullName = item.card.fullName;
    if (processedCards.has(fullName)) {
      return;
    }

    let chain = evolutionChains.get(chainKey);
    if (!chain) {
      chain = [];
      evolutionChains.set(chainKey, chain);
    }

    chain.push(item);
    processedCards.add(fullName);

    const pokemonCard = item.card as PokemonCard;

    for (const card of cardNameMap.get(pokemonCard.name) || []) {
      if (!processedCards.has(card.card.fullName)) {
        chain.push(card);
        processedCards.add(card.card.fullName);
      }
    }

    for (const otherItem of pokemonCards) {
      const otherPokemon = otherItem.card as PokemonCard;
      if (otherPokemon.evolvesFrom === pokemonCard.name && !processedCards.has(otherItem.card.fullName)) {
        addToChain(otherItem, chainKey);
      }
    }

    if (pokemonCard.evolvesFrom) {
      const preEvolutionCards = cardNameMap.get(pokemonCard.evolvesFrom);
      if (preEvolutionCards) {
        for (const preEvo of preEvolutionCards) {
          if (!processedCards.has(preEvo.card.fullName)) {
            addToChain(preEvo, chainKey);
          }
        }
      }
    }

    if (pokemonCard.evolvesTo && pokemonCard.evolvesTo.length > 0) {
      for (const evolutionName of pokemonCard.evolvesTo) {
        const evolutionCards = cardNameMap.get(evolutionName);
        if (evolutionCards) {
          for (const evo of evolutionCards) {
            if (!processedCards.has(evo.card.fullName)) {
              addToChain(evo, chainKey);
            }
          }
        }
      }
    }
  };

  for (const item of pokemonCards) {
    if (processedCards.has(item.card.fullName)) {
      continue;
    }
    const pokemonCard = item.card as PokemonCard;
    const basicName = findBasicPokemon(pokemonCard);
    addToChain(item, basicName || pokemonCard.name);
  }

  for (const chain of evolutionChains.values()) {
    chain.sort((a, b) => {
      const pokemonA = a.card as PokemonCard;
      const pokemonB = b.card as PokemonCard;
      const aStageIndex = STAGE_ORDER.indexOf(pokemonA.stage);
      const bStageIndex = STAGE_ORDER.indexOf(pokemonB.stage);
      const aIndex = aStageIndex === -1 ? Infinity : aStageIndex;
      const bIndex = bStageIndex === -1 ? Infinity : bStageIndex;
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      return pokemonA.name.localeCompare(pokemonB.name);
    });
  }

  const chainSortType = (chain: DeckSlot[]): CardType => {
    // Prefer the basic's type so cross-type evolutions stay in the basic's type group.
    const basic = chain.find((s) => (s.card as PokemonCard).stage === Stage.BASIC);
    return getPrimaryCardType((basic ?? chain[0]).card as PokemonCard);
  };

  const sortedChains = Array.from(evolutionChains.entries())
    .sort(([aKey, aChain], [bKey, bChain]) => {
      const typeCompare = compareCardType(chainSortType(aChain)) - compareCardType(chainSortType(bChain));
      if (typeCompare !== 0) return typeCompare;
      return aKey.localeCompare(bKey);
    })
    .flatMap(([, chain]) => chain);

  const sortedTrainerCards = trainerCards.slice().sort((a, b) => {
    const trainerA = a.card as TrainerCard;
    const trainerB = b.card as TrainerCard;
    const typeCompare = compareTrainerType(trainerA.trainerType) - compareTrainerType(trainerB.trainerType);
    if (typeCompare !== 0) return typeCompare;
    return trainerA.name.localeCompare(trainerB.name);
  });

  const sortedEnergyCards = energyCards.slice().sort((a, b) => {
    const energyA = a.card as EnergyCard;
    const energyB = b.card as EnergyCard;
    const typeCompare = compareEnergyType(energyA.energyType) - compareEnergyType(energyB.energyType);
    if (typeCompare !== 0) return typeCompare;
    return energyA.name.localeCompare(energyB.name);
  });

  return [...sortedChains, ...sortedTrainerCards, ...sortedEnergyCards];
}

export function canAddOne(slots: DeckSlot[], card: Card): CanAddResult {
  if (slots.reduce((sum, s) => sum + s.count, 0) >= 60) return { ok: false, reason: '卡组最多 60 张。' };
  if (card.tags.includes(CardTag.ACE_SPEC)) {
    const aceSpecCount = slots.filter((c) => c.card.tags.includes(CardTag.ACE_SPEC)).reduce((s, c) => s + c.count, 0);
    if (aceSpecCount >= 1) {
      return { ok: false, reason: '每套卡组只能放 1 张 ACE SPEC 卡。' };
    }
  }
  if (card.tags.includes(CardTag.RADIANT)) {
    const radiantCount = slots.filter((c) => c.card.tags.includes(CardTag.RADIANT)).reduce((s, c) => s + c.count, 0);
    if (radiantCount >= 1) {
      return { ok: false, reason: '每套卡组只能放 1 张光辉宝可梦。' };
    }
  }
  if (card.tags.includes(CardTag.PRISM_STAR)) {
    const prism = slots.find((c) => c.card.fullName === card.fullName);
    const prismCount = prism ? prism.count : 0;
    if (prismCount >= 1) {
      return { ok: false, reason: '同一种棱星卡只能放 1 张。' };
    }
  }
  if (!isBasicEnergy(card) && getSameNameCount(slots, card.name) >= 4) {
    return { ok: false, reason: '同名卡最多 4 张，基本能量除外。' };
  }
  return { ok: true };
}


function insertOrdered(list: DeckSlot[], newSlot: DeckSlot): DeckSlot[] {
  return sortDeckSlots([...list, newSlot]);
}

export function addCardToDeck(slots: DeckSlot[], card: Card): AddCardResult {
  const gate = canAddOne(slots, card);
  if (gate.ok === false) {
    return gate;
  }
  const idx = slots.findIndex((c) => cardPrintingKey(c.card) === cardPrintingKey(card));
  if (idx === -1) {
    return { ok: true, slots: insertOrdered(slots, { card, count: 1 }) };
  }
  const next = slots.map((s, i) => (i === idx ? { ...s, count: s.count + 1 } : s));
  if (!isBasicEnergy(card) && getSameNameCount(next, card.name) > 4) {
    return { ok: false, reason: '同名卡最多 4 张，基本能量除外。' };
  }
  return { ok: true, slots: sortDeckSlots(next) };
}

/** Max copies allowed for this printing (accounts for other printings of the same name). */
export function maxCountForPrinting(slots: DeckSlot[], card: Card): number {
  const otherSameNameCount = slots
    .filter((i) => i.card.name === card.name && cardPrintingKey(i.card) !== cardPrintingKey(card))
    .reduce((sum, i) => sum + i.count, 0);
  const maxPerName = isBasicEnergy(card) ? 60 : 4;
  const otherCount = slots.filter(s => cardPrintingKey(s.card) !== cardPrintingKey(card)).reduce((sum, s) => sum + s.count, 0);
  return Math.max(0, Math.min(maxPerName - otherSameNameCount, 60 - otherCount));
}

export type SetCountResult = { ok: true; slots: DeckSlot[] } | { ok: false; reason: string };

export function setSlotCount(slots: DeckSlot[], card: Card, count: number): SetCountResult {
  const maxForThisPrinting = maxCountForPrinting(slots, card);
  const cappedCount = Math.min(Math.max(0, Math.floor(count)), maxForThisPrinting);
  const without = slots.filter((s) => cardPrintingKey(s.card) !== cardPrintingKey(card));

  if (cappedCount === 0) {
    return { ok: true, slots: sortDeckSlots(without) };
  }

  let next = without;
  for (let i = 0; i < cappedCount; i++) {
    const res = addCardToDeck(next, card);
    if (!res.ok) {
      return res;
    }
    next = res.slots;
  }
  return { ok: true, slots: next };
}

export function removeOneCopy(slots: DeckSlot[], fullName: string): DeckSlot[] {
  const idx = slots.findIndex((c) => cardPrintingKey(c.card) === fullName);
  if (idx === -1) {
    return slots;
  }
  const next = slots.slice();
  if (next[idx].count <= 1) {
    next.splice(idx, 1);
  } else {
    next[idx] = { ...next[idx], count: next[idx].count - 1 };
  }
  return sortDeckSlots(next);
}

export function flatNamesFromSlots(slots: DeckSlot[]): string[] {
  return slots.flatMap((s) => Array.from({ length: s.count }, () => s.card.fullName));
}

export function flatPrintingIdsFromSlots(slots: DeckSlot[]): (string | null)[] {
  return slots.flatMap(s => Array.from({ length: s.count }, () => s.card.printingId || null));
}

export function slotsFromFlatNames(flat: string[], byFullName: Map<string, Card>, printingIds?: (string | null)[], byPrinting?: Map<string, Card>): {
  slots: DeckSlot[];
  unknown: string[];
} {
  const unknown: string[] = [];
  const counts = new Map<string, { card: Card; count: number }>();
  for (const [i, line] of flat.entries()) {
    const key = line.trim();
    if (!key) {
      continue;
    }
    if (!byFullName.has(key)) {
      unknown.push(key);
      continue;
    }
    const ref = printingIds?.[i];
    const base = byFullName.get(key)!;
    let card = ref ? byPrinting?.get(ref) : base;
    if (ref && !card && !isBasicEnergy(base)) card = Object.assign(Object.create(Object.getPrototypeOf(base)), base, { printingId: ref });
    if (canonicalFreePrintingId(ref) && card && card.name === base.name) card = Object.assign(Object.create(Object.getPrototypeOf(base)), base, { printingId: card.printingId, printingImage: card.printingImage });
    // Do not silently drop an unknown basic-energy appearance or pretend it is free.
    if (!card || card.fullName !== key) { unknown.push(`${key} [${ref}]`); continue; }
    const identity = cardPrintingKey(card);
    const previous = counts.get(identity);
    counts.set(identity, { card, count: (previous?.count ?? 0) + 1 });
  }
  const slots = [...counts.values()];
  return { slots: sortDeckSlots(slots), unknown };
}

export function reorderSlots(slots: DeckSlot[], activeId: string, overId: string): DeckSlot[] {
  const oldIndex = slots.findIndex((s) => cardPrintingKey(s.card) === activeId);
  const newIndex = slots.findIndex((s) => cardPrintingKey(s.card) === overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
    return slots;
  }
  const next = slots.slice();
  const [moved] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, moved);
  return next;
}

/** Replace one printing with another; merges stacks if the new fullName already exists. */
export function replaceSlotCard(slots: DeckSlot[], originalFullName: string, newCard: Card): DeckSlot[] {
  const mapped = slots.map((s) =>
    cardPrintingKey(s.card) === originalFullName ? { ...s, card: newCard } : { ...s },
  );
  const merged = new Map<string, DeckSlot>();
  for (const s of mapped) {
    const key = cardPrintingKey(s.card);
    const prev = merged.get(key);
    if (prev) {
      merged.set(key, { card: s.card, count: prev.count + s.count });
    } else {
      merged.set(key, s);
    }
  }
  return sortDeckSlots([...merged.values()]);
}
