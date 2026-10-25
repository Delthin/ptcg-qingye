import { useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Card, CardList, CardTarget } from 'ptcg-server';
import { CardFace } from '../../components/cards/CardFace';
import { cardDisplayName } from '../../duo/chineseCatalog';
import { cn } from '../../utils/cn';
import { BOARD_SELECTION_DROP_ID } from './board2dSelection';
import styles from './Board2DSelectionTray.module.css';

export type BoardSelectionItem = { target: CardTarget; card: Card; list: CardList };

export function Board2DSelectionTray({ switching, immediate = false, canDrop, selected, inspect, remove, scanUrl, setDamageAnchor }: {
  switching: boolean;
  immediate?: boolean;
  canDrop: boolean;
  selected: BoardSelectionItem[];
  inspect: (item: BoardSelectionItem) => void;
  remove: (target: CardTarget) => void;
  scanUrl: (card: Card, list: CardList) => string;
  setDamageAnchor: (anchor: { x: number; y: number } | null) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: BOARD_SELECTION_DROP_ID, disabled: !canDrop || switching });
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => {
      const rect = root.current?.getBoundingClientRect();
      setDamageAnchor(rect && selected.length ? { x: rect.left + rect.width / 2, y: rect.bottom } : null);
    };
    update();
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('resize', update); setDamageAnchor(null); };
  }, [selected.length, setDamageAnchor]);

  return <div ref={node => { root.current = node; setNodeRef(node); }}
    className={cn(styles.tray, switching && styles.switching, isOver && styles.over)}
    data-board-selection-tray role="region" aria-label={switching ? '拖放换位' : '效果目标选择区'}>
    <div className={styles.instructions}>
      <span role="status">{switching ? '将高亮备战宝可梦拖到同侧战斗区，松手完成换位' : immediate ? '将高亮宝可梦拖到这里，松手完成出牌' : '将高亮卡牌拖到这里选择，选好后按罗盘确认'}</span>
      <small>点击卡牌查看详情 · 键盘 Shift + Enter 选择</small>
    </div>
    {!switching && selected.length > 0 ? <div className={styles.selected}>
      {selected.map(item => <div className={styles.item} key={`${item.target.player}-${item.target.slot}-${item.target.index}`}>
        <button type="button" className={styles.card} onClick={() => inspect(item)} aria-label={`查看 ${cardDisplayName(item.card)}`}>
          <CardFace src={scanUrl(item.card, item.list)} card={item.card} name={item.card.name} draggable={false} />
        </button>
        <button type="button" className={styles.remove} onClick={() => remove(item.target)} aria-label={`取消选择 ${cardDisplayName(item.card)}`}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" /></svg>
        </button>
      </div>)}
    </div> : null}
  </div>;
}
