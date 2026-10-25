import { PlayerType, SlotType, SuperType, type Card, type CardList, type Player } from 'ptcg-server';

export type MotionCard = { card: Card; list: CardList; side: 'top' | 'bottom'; zone: string; selector: string };
export type MotionSnapshot = {
  cards: Map<string, MotionCard>;
  counts: Record<'top' | 'bottom', { deck: number; hand: number; prizes: number }>;
};

/** Only identities actually exposed by the server may be used for card-front flights. */
export function motionSnapshot(top: Player, bottom: Player): MotionSnapshot {
  const cards = new Map<string, MotionCard>();
  const counts = {} as MotionSnapshot['counts'];
  for (const [side, player, seat] of [['top', top, PlayerType.TOP_PLAYER], ['bottom', bottom, PlayerType.BOTTOM_PLAYER]] as const) {
    counts[side] = { deck: player.deck.cards.length, hand: player.hand.cards.length, prizes: player.prizes.reduce((n, p) => n + p.cards.length, 0) };
    const add = (list: CardList, zone: string, selector: string) => {
      if (list.isSecret || (side === 'top' && !list.isPublic)) return;
      list.cards.forEach(card => {
        if (card.superType === SuperType.NONE || card.fullName === 'Unknown') return;
        cards.set(`${player.id}:${card.id}`, { card, list, side, zone, selector });
      });
    };
    player.hand.cards.forEach((card, index) => {
      if (card.fullName !== 'Unknown' && card.superType !== SuperType.NONE && (side === 'bottom' || player.hand.isPublic)) {
        cards.set(`${player.id}:${card.id}`, { card, list: player.hand, side, zone: 'hand', selector: `[data-board2d-hand="${side}"] [data-hand-index="${index}"]` });
      }
    });
    add(player.active, 'active', `[data-slot-key="${seat}-${SlotType.ACTIVE}-0"]`);
    player.bench.forEach((list, index) => add(list, `bench-${index}`, `[data-slot-key="${seat}-${SlotType.BENCH}-${index}"]`));
    add(player.discard, 'discard', `[data-board2d-discard="${side}"]`);
    add(player.lostzone, 'lostzone', `[data-board2d-lostzone="${side}"]`);
    add(player.supporter, 'supporter', `[data-board2d-supporter="${side}"]`);
    add(player.stadium, 'stadium', '[data-board2d-stadium]');
    player.prizes.forEach((list, index) => add(list, `prize-${index}`, `[data-board2d-prize="${side}-${index}"]`));
  }
  return { cards, counts };
}

export type MotionMove = { key: string; card?: MotionCard; from: string; to: string; faceDown?: boolean };
export function motionMoves(previous: MotionSnapshot, next: MotionSnapshot): MotionMove[] {
  const moves: MotionMove[] = [];
  for (const [key, card] of next.cards) {
    const before = previous.cards.get(key);
    if (before && (before.zone !== card.zone || before.side !== card.side)) {
      moves.push({ key, card, from: before.selector, to: card.selector });
    } else if (!before && card.zone !== 'discard' && card.zone !== 'lostzone') {
      const side = card.side;
      let from: string;
      if (card.zone === 'hand') {
        from = previous.counts[side].prizes > next.counts[side].prizes
          ? `[data-board2d-prize^="${side}-"]` : `[data-board2d-deck="${side}"]`;
      } else {
        from = `[data-board2d-hand="${side}"]`;
      }
      moves.push({ key, card, from, to: card.selector });
    } else if (!before && (card.zone === 'discard' || card.zone === 'lostzone')) {
      moves.push({ key, card, from: `[data-board2d-hand="${card.side}"]`, to: card.selector });
    }
  }
  for (const [key, card] of previous.cards) {
    if (next.cards.has(key)) continue;
    const count = next.counts[card.side];
    const prev = previous.counts[card.side];
    if (count.deck > prev.deck || count.hand > prev.hand) {
      moves.push({ key, from: card.selector, to: `[data-board2d-${count.deck > prev.deck ? 'deck' : 'hand'}="${card.side}"]`, faceDown: true });
    }
  }
  // Hidden opponent draws do not have stable identities. Animate backs by count only.
  const topDraws = Math.min(next.counts.top.hand - previous.counts.top.hand, previous.counts.top.deck - next.counts.top.deck);
  const knownTopDraws = moves.filter(move => move.card?.side === 'top' && move.card.zone === 'hand').length;
  for (let i = knownTopDraws; i < Math.min(topDraws, 12); i++) {
    moves.push({ key: `hidden-draw-${i}`, from: '[data-board2d-deck="top"]', to: '[data-board2d-hand="top"]', faceDown: true });
  }
  return moves;
}
