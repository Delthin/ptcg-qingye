import { useTranslation } from 'react-i18next';
import type { Replay } from 'ptcg-server';
import type { LocalGameState } from '../types/localGameState';
import styles from './TableReplayControls.module.css';

export type TableReplayControlsProps = {
  localGame: LocalGameState;
  replay: Replay;
  onStep: (nextPosition: number, state: LocalGameState['state'], logs: LocalGameState['logs']) => void;
};
export function TableReplayControls({ localGame, replay, onStep }: TableReplayControlsProps) {
  const { t } = useTranslation();
  const count = replay.getStateCount(), pos = localGame.replayPosition;
  const go = (p: number) => {
    if (p < 1 || p > count) return;
    const state = replay.getState(p - 1);
    onStep(p, state, [...state.logs]);
  };
  return <div className={styles.root}>
    <button type="button" className={styles.replayBtn} aria-label={t('REACT_REPLAY_PREV',{defaultValue:'上一步'})} disabled={pos<=1} onClick={()=>go(pos-1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg></button>
    <span className={styles.meta} aria-label={`回放 ${pos} / ${count}`}>{pos} / {count}</span>
    <button type="button" className={styles.replayBtn} aria-label={t('REACT_REPLAY_NEXT',{defaultValue:'下一步'})} disabled={pos>=count} onClick={()=>go(pos+1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg></button>
  </div>;
}
