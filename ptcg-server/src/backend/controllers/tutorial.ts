import { Request, Response } from 'express';
import { User } from '../../storage';
import { HOME_STEPS, MAX_TUTORIAL_RECEIPTS, TUTORIAL_VERSION, TutorialEngineInput, TutorialReceipt, TutorialScenario, tutorialSteps } from '../../tutorial/scenario';
import { compareAndSetTutorial } from '../../tutorial/progress';
import { AuthToken } from '../services';
import { RateLimit } from '../common/rate-limit';
import { Controller, Get, Post } from './controller';

// Added in-place to User by the account/lobby migration. Existing accounts default to done.
type TutorialUser = User & { onboardingStage: string; onboardingStep: number; onboardingVersion: number; onboardingActions: string };

function history(user: TutorialUser): TutorialReceipt[] {
  const actions = JSON.parse(user.onboardingActions || '[]');
  if (!Array.isArray(actions) || actions.length > MAX_TUTORIAL_RECEIPTS || actions.some(action => !action || !Number.isInteger(action.step) || action.step < 0 || action.step >= tutorialSteps.length || !action.action)) {
    throw new Error('教学进度记录无效，请重新开始教程。');
  }
  return actions;
}

/** Store accepted raw action receipts, including in-step prompt confirmations. */
export function tutorialView(user: TutorialUser) {
  const storedStage = user.onboardingStage || 'done';
  const stage = storedStage.startsWith('skipped-') ? 'skipped' : storedStage;
  const resumeStage = storedStage === 'skipped-battle' ? 'battle' : 'home';
  const step = user.onboardingStep || 0;
  const hasBattle = stage === 'battle' || storedStage === 'skipped-battle';
  const actions = history(user);
  const scenario = hasBattle ? new TutorialScenario(actions) : null;
  if (scenario && scenario.completedSteps !== step) throw new Error('教学进度记录不一致，请重新开始教程。');
  return { version: user.onboardingVersion || TUTORIAL_VERSION, revision: actions.length, stage, step, homeTotal: HOME_STEPS, battleTotal: tutorialSteps.length,
    ...(stage === 'skipped' ? { resumeStage } : {}),
    ...(scenario ? { instruction: scenario.instruction(), battle: scenario.gameState() } : {}) };
}

export class Tutorial extends Controller {
  @Get('')
  @AuthToken()
  public async onState(req: Request, res: Response) {
    const user = await User.findOne(req.body.userId) as TutorialUser | undefined;
    if (!user || user.roleId === 1) { res.status(403).send({ error: 'AUTH_INVALID_PERMISSIONS' }); return; }
    res.setHeader('Cache-Control', 'no-store');
    try { res.send({ ok: true, tutorial: tutorialView(user) }); }
    catch { res.status(400).send({ error: 'TUTORIAL_INVALID', message: '教学进度记录无效，可以在设置中重新开始教程。' }); }
  }

  @Post('/action')
  @AuthToken()
  public async onAction(req: Request, res: Response) {
    const user = await User.findOne(req.body.userId) as TutorialUser | undefined;
    if (!user || user.roleId === 1) { res.status(403).send({ error: 'AUTH_INVALID_PERMISSIONS' }); return; }
    const limiter = RateLimit.getInstance();
    const key = `tutorial:${user.id}`;
    if (limiter.isLimitExceeded(key, 'http', 120)) { res.status(429).send({ error: 'REQUESTS_LIMIT_REACHED' }); return; }
    limiter.increment(key);
    const { version, step, revision, operation } = req.body;
    // Explicit recovery must work even if old receipts cannot be parsed/replayed.
    // Authentication and the complete original-record CAS still apply.
    if (operation === 'restart') {
      try {
        const updated = await compareAndSetTutorial(this.db.manager, {
          userId: user.id, stage: user.onboardingStage, step: user.onboardingStep,
          version: user.onboardingVersion, actions: user.onboardingActions,
          nextStage: 'home', nextStep: 0, nextActions: '[]',
        });
        if (!updated) {
          res.status(409).send({ error: 'TUTORIAL_STEP_MISMATCH', message: '教学进度已更新，请重试重新开始。' }); return;
        }
        user.onboardingStage = 'home'; user.onboardingStep = 0; user.onboardingActions = '[]';
        res.setHeader('Cache-Control', 'no-store');
        res.send({ ok: true, tutorial: tutorialView(user) });
      } catch {
        res.status(400).send({ error: 'TUTORIAL_INVALID', message: '暂时无法重新开始教学，请稍后重试。' });
      }
      return;
    }
    if (version !== TUTORIAL_VERSION || version !== user.onboardingVersion || !Number.isInteger(step) || step < 0 || step > tutorialSteps.length || !Number.isInteger(revision) || revision < 0 || typeof operation !== 'string') {
      res.status(400).send({ error: 'TUTORIAL_INVALID', message: '教学操作格式不正确。' }); return;
    }
    let storedHistory: TutorialReceipt[];
    try { storedHistory = history(user); }
    catch { res.status(400).send({ error: 'TUTORIAL_INVALID', message: '教学记录无效，请重新开始。' }); return; }
    if (step !== user.onboardingStep || revision !== storedHistory.length) {
      res.status(409).send({ error: 'TUTORIAL_STEP_MISMATCH', message: '教学进度已更新，请按当前提示继续。', tutorial: tutorialView(user) }); return;
    }
    const stage = user.onboardingStage;
    let nextStage = stage;
    let nextStep = step;
    let nextActions = user.onboardingActions;
    try {
      switch (operation) {
        case 'home-next':
          if (stage !== 'home' || step >= HOME_STEPS) throw new Error('请先恢复主页导览。');
          if (step === HOME_STEPS - 1) { nextStage = 'battle'; nextStep = 0; nextActions = '[]'; }
          else nextStep++;
          break;
        case 'act': {
          if (stage !== 'battle' || step >= tutorialSteps.length) throw new Error('请先恢复教学对局。');
          const actions = storedHistory;
          if (actions.length >= MAX_TUTORIAL_RECEIPTS) throw new Error('教学动作记录已达到上限。');
          // Legacy string intents are replay-only. New requests must name the real engine action.
          if (!req.body.action || typeof req.body.action !== 'object' || Array.isArray(req.body.action)) throw new Error('请使用正式牌桌完成教学操作。');
          const input: TutorialEngineInput = { step, action: req.body.action };
          const scenario = new TutorialScenario(actions);
          if (scenario.completedSteps !== step) throw new Error('教学记录不一致，请重新开始。');
          scenario.submitAction(input);
          actions.push(input);
          nextActions = JSON.stringify(actions);
          nextStep = scenario.completedSteps;
          break;
        }
        case 'finish':
          if (stage !== 'battle' || step !== tutorialSteps.length || new TutorialScenario(history(user)).snapshot().winner !== 'you') throw new Error('请先完成教学对局。');
          nextStage = 'done';
          break;
        case 'skip':
          if (stage !== 'home' && stage !== 'battle') throw new Error('教程当前没有在进行。');
          nextStage = `skipped-${stage}`;
          break;
        case 'resume':
          if (stage !== 'skipped-home' && stage !== 'skipped-battle') throw new Error('教程当前没有暂停。');
          nextStage = stage.slice('skipped-'.length);
          break;
        default: throw new Error('未知教学操作。');
      }
      // Compare-and-set prevents retries/two tabs from advancing or replaying a step twice.
      const updated = await compareAndSetTutorial(this.db.manager, {
        userId: user.id, stage, step, version, actions: user.onboardingActions, nextStage, nextStep, nextActions,
      });
      if (!updated) {
        const current = await User.findOne(user.id) as TutorialUser;
        res.status(409).send({ error: 'TUTORIAL_STEP_MISMATCH', message: '教学进度已更新，请按当前提示继续。', tutorial: tutorialView(current) }); return;
      }
      user.onboardingStage = nextStage; user.onboardingStep = nextStep; user.onboardingActions = nextActions;
      res.setHeader('Cache-Control', 'no-store');
      res.send({ ok: true, tutorial: tutorialView(user) });
    } catch (error) {
      res.status(400).send({ error: 'TUTORIAL_INVALID', message: error instanceof Error ? error.message : '这一步还没有完成，请按提示操作。' });
    }
  }
}
