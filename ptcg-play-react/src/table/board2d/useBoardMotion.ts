import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { GamePhase, PlayerType, SlotType, SuperType, type Card, type CardList, type Player } from 'ptcg-server';
import type { LocalGameState } from '../types/localGameState';
import type { BoardInteractionService } from '../BoardInteractionService';
import { publicAssetUrl } from '../../utils/publicAssetUrl';
import { cardDisplayName, localizeGameValue } from '../../duo/chineseCatalog';
import { motionMoves, motionSnapshot, type MotionSnapshot } from './boardMotionModel';
import styles from './BoardMotion.module.css';

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const EASE_MOVE = 'cubic-bezier(0.77, 0, 0.175, 1)';
type Stored = { model: MotionSnapshot; rects: Map<string, DOMRect>; damage: Map<string, number>; key: number };

export function useBoardMotion(
  root: RefObject<HTMLDivElement | null>, game: LocalGameState, top: Player, bottom: Player,
  scan: (card: Card, list?: CardList | null) => string, interaction: BoardInteractionService, layoutKey: string,
) {
  const previous = useRef<Stored | null>(null);
  const artifacts = useRef(new Set<HTMLElement>());
  const latest = useRef({ top, bottom });
  latest.current = { top, bottom };
  const revealQueue = useRef<{ src: string; name: string }[]>([]);
  const revealActive = useRef(false);
  const generation = useRef(0);
  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const attach = (node: HTMLElement) => { document.body.append(node); artifacts.current.add(node); };
  const remove = (node: HTMLElement) => { node.remove(); artifacts.current.delete(node); };
  const playReveal = () => {
    if (revealActive.current || !revealQueue.current.length) return;
    const item = revealQueue.current.shift()!;
    const gen = generation.current;
    revealActive.current = true;
    const node = document.createElement('div');
    node.className = styles.reveal;
    node.setAttribute('role', 'status');
    const title = document.createElement('strong'); title.textContent = '对手打出了';
    const img = document.createElement('img'); img.src = item.src; img.alt = item.name;
    const name = document.createElement('span'); name.textContent = item.name;
    node.append(title, img, name); attach(node);
    void (async () => {
      await node.animate(reduce() ? [{ opacity: 0 }, { opacity: 1 }] : [
        { opacity: 0, transform: 'translateX(32px) rotate(7deg) scale(.95)' },
        { opacity: 1, transform: 'translateX(0) rotate(0) scale(1)' },
      ], { duration: 200, easing: EASE_OUT, fill: 'both' }).finished.catch(() => undefined);
      await new Promise(resolve => window.setTimeout(resolve, 1400));
      if (gen !== generation.current) return;
      await node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' }).finished.catch(() => undefined);
      remove(node); revealActive.current = false; playReveal();
    })();
  };

  useLayoutEffect(() => {
    const host = root.current;
    if (!host) return;
    const model = motionSnapshot(top, bottom);
    const rects = new Map<string, DOMRect>();
    const rect = (selector: string) => {
      const result = host.querySelector(selector)?.getBoundingClientRect();
      if (result?.width && result.height) rects.set(selector, result);
      return result;
    };
    for (const card of model.cards.values()) rect(card.selector);
    for (const side of ['top', 'bottom']) {
      for (const zone of ['hand', 'deck', 'discard']) rect(`[data-board2d-${zone}="${side}"]`);
      rect(`[data-board2d-prize^="${side}-"]`);
    }
    const damage = new Map<string, number>();
    for (const [side, player, seat] of [['top', top, PlayerType.TOP_PLAYER], ['bottom', bottom, PlayerType.BOTTOM_PLAYER]] as const) {
      void side;
      damage.set(`[data-slot-key="${seat}-${SlotType.ACTIVE}-0"]`, player.active.damage);
      player.bench.forEach((list, index) => damage.set(`[data-slot-key="${seat}-${SlotType.BENCH}-${index}"]`, list.damage));
    }
    const old = previous.current?.key === game.localId ? previous.current : null;
    previous.current = { model, rects, damage, key: game.localId };
    if (!old && game.state.phase !== GamePhase.SETUP) return; // Reconnect is not a replay of past moves.
    const before = old?.model ?? { cards: new Map(), counts: {
      top: { deck: model.counts.top.deck + model.counts.top.hand, hand: 0, prizes: 0 },
      bottom: { deck: model.counts.bottom.deck + model.counts.bottom.hand, hand: 0, prizes: 0 },
    } };
    const movements = motionMoves(before, model).slice(0, 24);
    const flights: Promise<unknown>[] = [];
    movements.forEach((move, index) => {
      const from = old?.rects.get(move.from) ?? rect(move.from);
      const to = rects.get(move.to) ?? rect(move.to);
      if (!from?.width || !to?.width) return;
      const img = document.createElement('img');
      img.className = styles.flight;
      img.alt = '';
      img.src = move.faceDown || !move.card ? publicAssetUrl('assets/duo-cardback.svg') : scan(move.card.card, move.card.list);
      // Hand-strip bounds are wider than a card; use a realistic card footprint.
      const width = Math.min(from.width, 96);
      const height = Math.min(from.height, width * 1.4);
      const x = from.left + (from.width - width) / 2;
      const y = from.top + (from.height - height) / 2;
      Object.assign(img.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` });
      attach(img);
      const endWidth = Math.min(to.width, 104);
      const endHeight = Math.min(to.height, endWidth * 1.4);
      const dx = to.left + (to.width - endWidth) / 2 - x;
      const dy = to.top + (to.height - endHeight) / 2 - y;
      const animation = img.animate(reduce() ? [{ opacity: 0 }, { opacity: .9 }, { opacity: 0 }] : [
        { opacity: .95, transform: 'translate(0, 0) rotate(-5deg) scale(1)' },
        { opacity: 1, transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(${endWidth / width}, ${endHeight / height})` },
      ], { duration: reduce() ? 100 : 250, delay: Math.min(index, 8) * 40, easing: EASE_MOVE, fill: 'both' });
      flights.push(animation.finished.catch(() => undefined).then(() => remove(img)));
      const prior = before.cards.get(move.key);
      if (move.card?.side === 'top' && move.card.card.superType === SuperType.TRAINER &&
        prior?.zone !== move.card.zone && (!prior || prior.zone === 'hand')) {
        revealQueue.current.push({ src: scan(move.card.card, move.card.list), name: cardDisplayName(move.card.card) });
      }
    });
    playReveal();
    const finished = Promise.all(flights).then(() => undefined);
    interaction.setPendingDrawAnimationPromise(finished);
    interaction.setPendingHandToDeckAnimationPromise(finished);
    // Damage is driven by server state, never predicted by a client-side animation.
    if (old) for (const [selector, value] of damage) {
      const increase = value - (old.damage.get(selector) ?? value);
      if (increase <= 0) continue;
      const anchor = rect(selector);
      if (!anchor) continue;
      const chip = document.createElement('span'); chip.className = styles.damage; chip.textContent = `−${increase}`;
      Object.assign(chip.style, { left: `${anchor.left + anchor.width / 2}px`, top: `${anchor.top}px` }); attach(chip);
      void chip.animate(reduce() ? [{ opacity: 1 }, { opacity: 0 }] : [
        { opacity: 1, transform: 'translate(-50%, 0) scale(1.1)' },
        { opacity: 0, transform: 'translate(-50%, -32px) scale(1)' },
      ], { duration: 700, easing: EASE_OUT }).finished.catch(() => undefined).then(() => remove(chip));
    }
  }, [game.state, game.localId, top, bottom, scan, interaction, root, layoutKey]);

  useEffect(() => {
    const getActor = (id: number, slot: string | number | undefined, index?: number) => {
      const { top, bottom } = latest.current;
      const player = id === top.id ? top : id === bottom.id ? bottom : undefined;
      if (!player) return;
      const value = String(slot).toLowerCase();
      const kind = value === 'bench' || value === String(SlotType.BENCH) ? SlotType.BENCH
        : value === 'active' || value === String(SlotType.ACTIVE) ? SlotType.ACTIVE : undefined;
      if (kind === undefined) return;
      // Active is unique; a Bench event must identify its actual index, including zero.
      const targetIndex = kind === SlotType.ACTIVE ? index ?? 0 : index;
      if (typeof targetIndex !== 'number' || !Number.isInteger(targetIndex) || targetIndex < 0 ||
        (kind === SlotType.ACTIVE ? targetIndex !== 0 : targetIndex >= player.bench.length)) return;
      const seat = player === top ? PlayerType.TOP_PLAYER : PlayerType.BOTTOM_PLAYER;
      return root.current?.querySelector<HTMLElement>(`[data-slot-key="${seat}-${kind}-${targetIndex}"]`);
    };
    const feedback = (node: HTMLElement | null | undefined, attack = false) => {
      if (!node) return Promise.resolve();
      const keyframes = reduce() ? [{ opacity: .6 }, { opacity: 1 }] : attack ? [
        { transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-14px) scale(1.05)', offset: .4 }, { transform: 'translateY(0) scale(1)' },
      ] : [{ transform: 'scale(.95)', opacity: .7 }, { transform: 'scale(1)', opacity: 1 }];
      return node.animate(keyframes, { duration: 250, easing: EASE_OUT }).finished.then(() => undefined).catch(() => undefined);
    };
    const subscriptions = [
      interaction.attackAnimation$.subscribe(event => {
        interaction.setPendingAttackAnimationPromise(feedback(getActor(event.playerId, event.slot, event.index), true));
      }),
      interaction.abilityAnimation$.subscribe(event => {
        const actor = getActor(event.playerId, event.slot, event.index);
        interaction.setPendingAbilityAnimationPromise(feedback(actor));
        if (!actor) return;
        const rect = actor.getBoundingClientRect();
        const text = document.createElement('span'); text.className = styles.ability; text.textContent = String(localizeGameValue(event.abilityName));
        Object.assign(text.style, { left: `${rect.left + rect.width / 2}px`, top: `${rect.top}px` }); attach(text);
        void text.animate([{ opacity: 1 }, { opacity: 1, offset: .75 }, { opacity: 0 }], { duration: 1000 }).finished.catch(() => undefined).then(() => remove(text));
      }),
      interaction.basicAnimation$.subscribe(event => { void feedback(getActor(event.playerId, event.slot, event.index)); }),
      interaction.evolutionAnimation$.subscribe(event => { void feedback(getActor(event.playerId, event.slot, event.index)); }),
      interaction.deckShuffleAnimation$.subscribe(event => {
        const side = event.playerId === latest.current.top.id ? 'top' : 'bottom';
        const deck = root.current?.querySelector<HTMLElement>(`[data-board2d-deck="${side}"]`);
        const result = !deck ? Promise.resolve() : deck.animate(reduce() ? [{ opacity: .65 }, { opacity: 1 }] : [
          { transform: 'translateX(0) rotate(0)' }, { transform: 'translateX(-8px) rotate(-5deg)', offset: .3 },
          { transform: 'translateX(8px) rotate(5deg)', offset: .65 }, { transform: 'translateX(0) rotate(0)' },
        ], { duration: 250, easing: EASE_MOVE }).finished.then(() => undefined).catch(() => undefined);
        interaction.setPendingDeckShuffleAnimationPromise(result);
      }),
    ];
    return () => subscriptions.forEach(s => s.unsubscribe());
  }, [interaction, root]);

  useEffect(() => () => {
    generation.current++;
    revealQueue.current = [];
    for (const node of artifacts.current) { node.getAnimations().forEach(a => a.cancel()); node.remove(); }
    artifacts.current.clear();
  }, []);
}
