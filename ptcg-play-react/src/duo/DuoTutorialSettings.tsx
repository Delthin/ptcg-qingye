import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShellButton } from '../components/ui/ShellButton';
import { getTutorial, restartTutorial, tutorialAction, type TutorialState } from '../tutorial/tutorialApi';
import styles from './DuoUtilityPages.module.css';

export function DuoTutorialSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const owner = useRef(user?.userId);
  owner.current = user?.userId;
  const [tutorial, setTutorial] = useState<TutorialState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setTutorial(null); setError(''); setBusy(false);
    void getTutorial().then(value => { if (active) setTutorial(value); }).catch(() => { if (active) setError('教程进度没有加载成功，请刷新后重试。'); });
    return () => { active = false; };
  }, [user?.userId]);

  async function open(restart = false) {
    if (busy || (!restart && !tutorial)) return;
    const userId = owner.current;
    setBusy(true); setError('');
    try {
      const next = restart ? await restartTutorial() :
        tutorial!.stage === 'skipped' ? await tutorialAction({ version: tutorial!.version, step: tutorial!.step, revision: tutorial!.revision, operation: 'resume' }) : tutorial!;
      if (owner.current !== userId) return;
      setTutorial(next);
      navigate(next.stage === 'battle' ? '/tutorial' : '/games');
    } catch (cause) { if (owner.current === userId) setError(cause instanceof Error ? cause.message : '教程没有打开，请稍后重试。'); }
    finally { if (owner.current === userId) setBusy(false); }
  }

  const status = !tutorial ? error ? '教程进度暂时无法读取，可重新开始。' : '正在同步账号进度…' : tutorial.stage === 'done' ? '已完成或无需强制学习，可随时重新体验。' :
    tutorial.stage === 'home' || tutorial.resumeStage === 'home' ? `主页导览 · ${tutorial.step + 1}/${tutorial.homeTotal}` :
      `教学对局 · 已完成 ${tutorial.step}/${tutorial.battleTotal} 步`;
  return <section className={styles.block} aria-labelledby="tutorial-settings-title">
    <div className={styles.blockHead}><span className={styles.blockIndex}>05</span><h2 className={styles.blockTitle} id="tutorial-settings-title">新手教程</h2></div>
    <div className={styles.row}><span className={styles.rowLabel}><strong>{status}</strong><small>进度跟随账号保存。教程不扣游戏元，不占用收藏，也不计入正式战绩。</small></span></div>
    <div className={styles.tutorialActions}>
      {tutorial && tutorial.stage !== 'done' && <ShellButton disabled={busy} onClick={() => void open()}>继续教程</ShellButton>}
      {tutorial?.stage === 'done' && <ShellButton variant="secondary" disabled={busy} onClick={() => navigate('/tutorial')}>查看新手礼包</ShellButton>}
      <ShellButton variant="secondary" disabled={busy || (!tutorial && !error)} onClick={() => void open(true)}>{tutorial?.stage === 'done' ? '重新学习' : '从主页导览重新开始'}</ShellButton>
      <a className={styles.ruleLink} href="https://www.pokemon.cn/tcg-rules-howtoplay" target="_blank" rel="noreferrer">官方基础规则 ↗</a>
    </div>
    {error && <p role="alert">{error}</p>}
  </section>;
}
