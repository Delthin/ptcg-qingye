import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useViewportBounds } from '../hooks/useViewportBounds';
import { useAuth } from '../context/AuthContext';
import { DuoVisibilityToggle } from '../duo/DuoVisibilityToggle';
import { useEconomy } from '../collection/EconomyContext';
import { appConfig } from '../env/config';
import { starterGifts } from './starterGifts';
import {
  getTutorial,
  tutorialAction,
  tutorialErrorMessage,
  isTutorialMismatch,
  type TutorialState,
} from './tutorialApi';
import styles from './HomeTour.module.css';

/**
 * 首页功能导览（6 步）：配置步骤 + 稳定 data-tour 锚点 + 聚光高亮浮层。
 * 只在 /games 自动查询教学状态；stage=home 时展示导览，stage=battle 时
 * 在大厅角落提供「继续教学」入口，不强制抢导航。锚点缺失时退化为居中卡片。
 */

interface HomeStepConfig {
  /** 依次尝试的 data-tour 锚点；全部缺失时居中展示。 */
  targets: string[];
  title: string;
  description: string;
}

const HOME_STEPS: HomeStepConfig[] = [
  {
    targets: ['brand'],
    title: '欢迎来到训练家卡桌',
    description:
      '注册时，你的账号已收到两套预组（每套 60 张）和对应的 120 张收藏卡，无需完成教学再领取。这里是对战大厅，顶栏可以切换各个页面；先熟悉一圈吧。',
  },
  {
    targets: ['selected-deck', 'nav-deck'],
    title: '选择 / 编辑卡组',
    description:
      '你已拥有一套嗨皮预组和一套对战派对预组，共两套、120 张对应收藏卡。第一套已设为出战；可在大厅更换，在卡组页编辑与构筑。满足 60 张、同名限制和持有数量后即可对战。',
  },
  {
    targets: ['nav-collection'],
    title: '收藏',
    description:
      '收藏页汇总你拥有的每一张卡牌，可用搜索查找卡牌、按稀有度筛选，并查看持有数量。开包获得的卡都会归档在这里。',
  },
  {
    targets: ['nav-shop'],
    title: '商店：签到与开包',
    description:
      '商店页每天可以签到领取游戏元，再购买补充包、开包获得新卡。导览不会替你花费游戏元。',
  },
  {
    targets: ['nav-records'],
    title: '战绩',
    description:
      '战绩页保留正式对局的胜负记录与回放入口，随时可以回顾每局对战的过程和结果。',
  },
  {
    targets: ['lobby-visibility'],
    title: '公开可见性与好友',
    description:
      '大厅展示公开训练家和你的好友。新账号默认不公开；你可以在这里选择是否出现在公开大厅。关闭时仍能经精确用户名查找或好友约战。',
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function findAnchor(targets: string[]): HTMLElement | null {
  for (const target of targets) {
    const found = [...document.querySelectorAll(`[data-tour="${CSS.escape(target)}"]`)].find(element => !element.closest('[data-home-tour]') && element.getClientRects().length > 0);
    if (found instanceof HTMLElement) return found;
  }
  return null;
}

export function HomeTour() {
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useAuth();
  const economy = useEconomy();
  const gifts = useMemo(() => starterGifts(economy.snapshot, user?.userId ?? 0, appConfig.apiUrl), [economy.snapshot, user?.userId]);
  const navigate = useNavigate();
  const onGames = pathname === '/games';

  const [state, setState] = useState<TutorialState | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const generationRef = useRef(0);
  const pendingRef = useRef(false);
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const viewport = useViewportBounds();
  const [tooltipHeight, setTooltipHeight] = useState(260);
  useLayoutEffect(() => {
    const tooltip = tooltipRef.current;
    if (!open || !tooltip) return;
    const measure = () => setTooltipHeight(tooltip.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(tooltip);
    return () => observer.disconnect();
  }, [open]);

  // 只在 /games 且已登录时查询教学状态；离开页面 / 切换账号时中止旧请求。
  useEffect(() => {
    const generation = ++generationRef.current;
    pendingRef.current = false;
    setState(null); setOpen(false); setPending(false); setError('');
    if (!onGames || !isAuthenticated) {
      setOpen(false);
      setState(null);
      return;
    }
    const controller = new AbortController();
    void (async () => {
      try {
        const tutorial = await getTutorial(controller.signal);
        if (generation !== generationRef.current) return;
        setState(tutorial);
        setOpen(tutorial.stage === 'home');
      } catch {
        if (controller.signal.aborted || generation !== generationRef.current) return;
        // 查询失败不打扰用户，仅不弹导览。
      }
    })();
    return () => { controller.abort(); generationRef.current++; };
  }, [onGames, isAuthenticated, user?.userId]);

  const stepIndex = Math.max(0, Math.min(state?.step ?? 0, HOME_STEPS.length - 1));
  const step = HOME_STEPS[stepIndex];
  const isLast = stepIndex === HOME_STEPS.length - 1;

  // 聚光框跟随锚点：resize / 任意容器滚动时重算（rAF 节流）。
  useLayoutEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }
    const anchor = findAnchor(step.targets);
    if (!anchor) {
      setRect(null);
      return;
    }
    anchor.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const box = anchor.getBoundingClientRect();
        setRect({
          top: box.top - 6,
          left: box.left - 6,
          width: box.width + 12,
          height: box.height + 12,
        });
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { capture: true, passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, { capture: true } as EventListenerOptions);
    };
  }, [open, step]);

  // 浮层出现 / 换步时把焦点放到主按钮，键盘可直接 Enter 推进。
  useEffect(() => {
    if (open) primaryButtonRef.current?.focus();
  }, [open, stepIndex]);

  const runAction = useCallback(
    async (operation: 'home-next' | 'skip'): Promise<TutorialState | null> => {
      if (!state || pendingRef.current) return null;
      pendingRef.current = true;
      setPending(true);
      setError('');
      const generation = generationRef.current;
      try {
        const next = await tutorialAction({ version: state.version, step: state.step, revision: state.revision, operation });
        if (generation !== generationRef.current) return null;
        setState(next);
        return next;
      } catch (e) {
        if (generation !== generationRef.current) return null;
        if (isTutorialMismatch(e)) {
          try {
            const fresh = await getTutorial();
            if (generation !== generationRef.current) return null;
            setState(fresh); setOpen(fresh.stage === 'home');
            setError('进度已在别处更新，当前提示已同步。');
          } catch { if (generation === generationRef.current) setError(tutorialErrorMessage(e)); }
        } else setError(tutorialErrorMessage(e));
        return null;
      } finally {
        if (generation === generationRef.current) { pendingRef.current = false; setPending(false); }
      }
    },
    [state, pending],
  );

  const goNext = useCallback(() => {
    void (async () => {
      const next = await runAction('home-next');
      if (!next) return;
      if (next.stage === 'battle') {
        setOpen(false);
        navigate('/tutorial');
      }
    })();
  }, [runAction, navigate]);

  const skip = useCallback(() => {
    void (async () => {
      const next = await runAction('skip');
      if (next) setOpen(false);
    })();
  }, [runAction]);

  // Escape 随时跳过导览（服务端会持久化 skipped，可在设置中重学）。
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault(); skip();
      } else if (event.key === 'Tab') {
        const controls = [...tooltipRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]') ?? []].filter(element => element.getClientRects().length > 0);
        if (!controls.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (!controls.includes(document.activeElement as HTMLElement) || (!event.shiftKey && document.activeElement === last)) { event.preventDefault(); first.focus(); }
        else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, skip]);

  // stage=battle：大厅角落的「继续教学」入口，不遮挡、不抢导航。
  if (!open) {
    if (onGames && state?.stage === 'battle') {
      return (
        <button type="button" className={styles.resumeFab} onClick={() => navigate('/tutorial')}>
          <span className={styles.resumeBall} aria-hidden="true" />
          继续教学对局
          <span className={styles.resumeArrow} aria-hidden="true">→</span>
        </button>
      );
    }
    return null;
  }

  // 浮层定位：优先锚点下方，空间不足放上方，水平方向夹在视口内；无锚点时居中。
  const tooltipWidth = Math.min(360, viewport.width - 24);
  const minLeft = viewport.left + 12;
  const minTop = viewport.top + 12;
  const maxBottom = viewport.top + viewport.height - 12;
  let tooltipStyle: CSSProperties;
  if (rect) {
    const below = rect.top + rect.height + 12;
    const height = Math.min(tooltipHeight, viewport.height - 24);
    const roomBelow = maxBottom - below > height;
    const left = Math.max(minLeft, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, viewport.left + viewport.width - tooltipWidth - 12));
    const top = Math.max(minTop, Math.min(roomBelow ? below : rect.top - height - 12, maxBottom - height));
    tooltipStyle = { top, left, width: tooltipWidth, maxHeight: maxBottom - top, overflowY: 'auto' };
  } else {
    tooltipStyle = { top: viewport.top + viewport.height / 2, left: viewport.left + viewport.width / 2,
      transform: 'translate(-50%, -50%)', width: tooltipWidth, maxHeight: viewport.height - 24, overflowY: 'auto' };
  }

  return createPortal(
    <div className={styles.overlay} data-home-tour="active" data-anchored={rect ? true : undefined}>
      {rect && (
        <div
          className={styles.spotlight}
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          aria-hidden="true"
        />
      )}
      <div ref={tooltipRef} className={styles.tooltip} style={tooltipStyle} role="dialog" aria-modal="true" aria-label={step.title}>
        <p className={styles.stepCount}>
          新手导览 · 第 {stepIndex + 1} / {HOME_STEPS.length} 步
        </p>
        <h2 className={styles.title}>{step.title}</h2>
        <p className={styles.description}>{step.description}</p>
        {stepIndex < 2 && gifts.length === 2 && <p className={styles.description} role="status">
          已到账：{gifts.map(gift => `「${gift.name}」`).join('、')}，各 {gifts[0].cardCount} 张。预组已在卡组页，对应卡牌已在收藏页。
        </p>}
        {isLast && <DuoVisibilityToggle tone="paper" />}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.skipButton} onClick={skip} disabled={pending}>
            跳过导览
          </button>
          <button
            ref={primaryButtonRef}
            type="button"
            className={styles.nextButton}
            onClick={goNext}
            disabled={pending}
          >
            {isLast ? '开始教学对局' : '下一步'}
          </button>
        </div>
        <div className={styles.dots} aria-hidden="true">
          {HOME_STEPS.map((item, index) => (
            <span
              key={item.title}
              className={styles.dot}
              data-state={index < stepIndex ? 'done' : index === stepIndex ? 'current' : 'todo'}
            />
          ))}
        </div>
      </div>
    </div>, document.body,
  );
}
