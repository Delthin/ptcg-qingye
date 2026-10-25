export interface DeckSaveRequest {
  id: number;
  name: string;
  cards: string[];
  printingIds?: (string | null)[];
  manualArchetype1?: string;
  manualArchetype2?: string;
  sleeveIdentifier?: string;
  sleeveImagePath?: string;
}

export interface Deck {
  id: number;
  name: string;
  isValid: boolean;
  cards: string;
  printingIds?: string;
  cardTypes: string;
  manualArchetype1: string | null;
  manualArchetype2: string | null;
  sleeveIdentifier?: string;
  sleeveImagePath?: string;
}
