import { AddPlayerAction } from '../game/store/actions/add-player-action';
import { AttackAction, PassTurnAction, RetreatAction, RetreatStartAction } from '../game/store/actions/game-actions';
import { CardTarget, PlayCardAction, PlayerType, SlotType } from '../game/store/actions/play-card-action';
import { ResolvePromptAction } from '../game/store/actions/resolve-prompt-action';
import { Format, SuperType } from '../game/store/card/card-types';
import { PokemonCard } from '../game/store/card/pokemon-card';
import { FREE_BASIC_ENERGIES } from '../game/store/card/free-basic-energy';
import { CoinFlipPrompt } from '../game/store/prompts/coin-flip-prompt';
import { ConfirmPrompt } from '../game/store/prompts/confirm-prompt';
import { ChoosePokemonPrompt } from '../game/store/prompts/choose-pokemon-prompt';
import { ChoosePrizePrompt } from '../game/store/prompts/choose-prize-prompt';
import { ChooseStartingPokemonPrompt } from '../game/store/prompts/choose-starting-pokemon-prompt';
import { Prompt } from '../game/store/prompts/prompt';
import { ShuffleDeckPrompt } from '../game/store/prompts/shuffle-prompt';
import { WaitPrompt } from '../game/store/prompts/wait-prompt';
import { PokemonCardList } from '../game/store/state/pokemon-card-list';
import { GamePhase, GameWinner, State } from '../game/store/state/state';
import { Store } from '../game/store/store';
import { GameSettings } from '../game/core/game-settings';
import { DeckAnalyser } from '../game/cards/deck-analyser';
import { ChooseEnergyPrompt } from '../game/store/prompts/choose-energy-prompt';
import { StateSanitizer } from '../backend/socket/state-sanitizer';
import { GameState } from '../backend/interfaces/core.interface';
import { StateSerializer } from '../game/serializer/state-serializer';
import { Base64 } from '../utils/base64';

export const TUTORIAL_VERSION = 1;
export const HOME_STEPS = 6;
const YOU = 1;
const COACH = 2;
const ENERGY = 'Lightning Energy SVE';
const EEVEE = 'Eevee SFA';
const BASIC = 'Magnemite SVI';
const EVOLUTION = 'Magneton SSP';
const POTION = 'Potion BCR';
const SUPPORTER = 'Nemona SVI';
const OPPONENT = 'Pawmi SVI';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  target: 'hand' | 'active' | 'bench' | 'pass' | 'attack' | 'prizes';
  cardFullName?: string;
}

/** Each lesson gates real engine actions, never accepts a client-supplied state. */
export const tutorialSteps: TutorialStep[] = [
  { id: 'setup', title: '先摆好战斗宝可梦', description: '双方各用 60 张卡组，抽取 7 张手牌。从手牌选一只基础宝可梦放在战斗场；开局还会放置 6 张背面朝上的奖赏卡。先在正式提示中确认先攻，再把伊布拖到战斗区，不摆备战宝可梦，点击右下确认键提交预备牌阵。', actionLabel: '让伊布出战', target: 'hand', cardFullName: EEVEE },
  { id: 'bench', title: '准备替补宝可梦', description: '备战区通常最多放 5 只宝可梦。把手牌里的基础宝可梦小磁怪放上备战区，为后面的进化做准备。', actionLabel: '放置小磁怪', target: 'hand', cardFullName: BASIC },
  { id: 'energy-active', title: '每回合附一张能量', description: '能量从手牌附在自己的宝可梦身上，通常每回合只能附 1 张。这次先给战斗场的伊布附一张基本雷能量。', actionLabel: '给伊布附能量', target: 'hand', cardFullName: ENERGY },
  { id: 'first-pass', title: '先攻首回合的限制', description: '先攻玩家首回合不能使用招式或支援者；通常双方自己的首回合也不能进化。这一回合我们直接结束。电脑会给布拨附能量，再用“殴打”造成 10 伤害。', actionLabel: '结束首回合', target: 'pass' },
  { id: 'potion', title: '使用物品卡', description: '回合开始自动抽 1 张。物品卡通常可以使用多张，使用后进入弃牌区。这张伤药可以回复一只宝可梦的 30 点伤害。', actionLabel: '使用伤药', target: 'hand', cardFullName: POTION },
  { id: 'heal', title: '选择卡牌效果的目标', description: '伤药需要指定受伤的宝可梦。选择战斗场的伊布，再点击右下确认键：它受到的 10 点伤害会清除。实战里检索、回复等效果也会要求你选择目标并确认。', actionLabel: '回复伊布', target: 'active' },
  { id: 'supporter', title: '每回合一张支援者', description: '妮莫是支援者，使用后抽 3 张。通常每回合只能使用 1 张支援者，但物品卡不占这次机会。', actionLabel: '使用妮莫', target: 'hand', cardFullName: SUPPORTER },
  { id: 'evolve', title: '沿进化链进化', description: '小磁怪已经在之前的回合上场，现在可以进化为三合一磁怪。进化不会清除伤害或附着的能量；刚上场和刚进化的宝可梦通常不能在同回合再进化。', actionLabel: '进化小磁怪', target: 'hand', cardFullName: EVOLUTION },
  { id: 'energy-bench', title: '能量也可以附在备战区', description: '这个回合还没从手牌附能量。给备战区的三合一磁怪附 1 张基本雷能量，为它的“雷电球”准备。', actionLabel: '给备战区附能量', target: 'hand', cardFullName: ENERGY },
  { id: 'retreat', title: '支付撤退费用换上替补', description: '伊布撤退需要弃掉 1 个能量。通常每回合只能撤退一次，换位后伤害和剩余能量保留。打开伊布的卡牌菜单选择撤退。它只有一张雷能量，正式规则会自动支付这笔确定的费用；再选择备战区的三合一磁怪并点击右下确认键。', actionLabel: '撤退，换上三合一磁怪', target: 'active' },
  { id: 'charge-pass', title: '读懂招式的能量要求', description: '“雷电球”需要 1 个雷能量加任意 1 个能量，现在只有 1 个，不够使用。这个回合已经附过能量，先结束回合等待下一次机会。', actionLabel: '结束回合', target: 'pass' },
  { id: 'energy-second', title: '再附一张，满足费用', description: '三合一磁怪现在可以再附 1 张基本雷能量。无色能量符号可以由任意属性的能量支付，不需要一种名为“无色能量”的基础卡。', actionLabel: '附第二张能量', target: 'hand', cardFullName: ENERGY },
  { id: 'attack-first', title: '使用招式结束回合', description: '“雷电球”造成 40 伤害。使用招式后回合结束；除非卡牌效果要求，攻击不会弃掉附着的能量。电脑将按固定脚本回应。', actionLabel: '雷电球 · 40', target: 'attack' },
  { id: 'attack-knockout', title: '伤害达到 HP 就会昏厥', description: '布拨有 60 HP，已经受到 40 伤害。再用一次“雷电球”即可使它昏厥，布拨和它附着的卡会进入弃牌区。', actionLabel: '再次使用雷电球', target: 'attack' },
  { id: 'prize', title: '拿取自己的奖赏卡', description: '使普通宝可梦昏厥后，拿 1 张自己的奖赏卡加入手牌；有特别规则的宝可梦按卡文拿取。选择一张背面的奖赏卡，再点击右下确认键。电脑会换上备战区的布拨。', actionLabel: '拿取一张奖赏卡', target: 'prizes' },
  { id: 'attack-last-first', title: '继续对战', description: '你不必每次攻击都重新附能量。三合一磁怪保留了两张能量，直接使用“雷电球”，给最后一只布拨造成 40 伤害。', actionLabel: '雷电球 · 40', target: 'attack' },
  { id: 'attack-last', title: '对手没有替补时也能获胜', description: '再次攻击会使最后一只布拨昏厥。对手场上没有宝可梦，也是一种获胜方式，不需要再拿完剩余奖赏卡。', actionLabel: '使用雷电球，完成对战', target: 'attack' },
];

// Version 1 legacy receipts remain replayable, but cannot be submitted over HTTP.
export interface TutorialInput { step: number; action: string; cardId?: number; prizeIndex?: number; }
export type TutorialEngineAction =
  | { type: 'playCard'; handIndex: number; target: CardTarget }
  | { type: 'resolvePrompt'; id: number; result: unknown }
  | { type: 'retreatStart' }
  | { type: 'retreat'; to: number }
  | { type: 'attack'; attack: string }
  | { type: 'passTurn' };
export interface TutorialEngineInput { step: number; action: TutorialEngineAction; }
export type TutorialReceipt = TutorialInput | TutorialEngineInput;
export const MAX_TUTORIAL_RECEIPTS = 128;

export class TutorialScenario {
  public readonly store: Store;
  private botEnergyTurns = new Set<number>();
  public completedSteps = 0;

  constructor(history: number | TutorialReceipt[] = []) {
    this.store = new Store({ onStateChange: state => { this.store.state = state; } });
    const settings = new GameSettings();
    settings.format = Format.UNLIMITED;
    settings.recordingEnabled = false;
    settings.timeLimit = 0;
    this.store.state.rules = settings.rules;
    this.store.state.gameSettings = settings;
    const playerDeck = [EEVEE, BASIC, EVOLUTION, POTION, SUPPORTER, ENERGY, ENERGY, ...Array(53).fill(ENERGY)];
    const coachDeck = [OPPONENT, OPPONENT, ...Array(58).fill(ENERGY)];
    if (!new DeckAnalyser(playerDeck).isValid(Format.UNLIMITED) || !new DeckAnalyser(coachDeck).isValid(Format.UNLIMITED)) {
      throw new Error('教学卡组没有通过合法性检查。');
    }
    this.store.dispatch(new AddPlayerAction(YOU, '你', playerDeck));
    this.store.dispatch(new AddPlayerAction(COACH, '教学电脑', coachDeck));
    const legacy = typeof history === 'number' || (history.length > 0 && typeof history[0].action === 'string');
    this.flush(legacy);
    if (Array.isArray(history)) {
      if (history.length > MAX_TUTORIAL_RECEIPTS) throw new Error('教学进度记录无效。');
      let rawStarted = false;
      for (const input of history) {
        if (typeof input.action === 'string') {
          if (rawStarted) throw new Error('旧教学记录只能出现在真实动作之前。');
          this.submit(input as TutorialInput);
        } else {
          rawStarted = true;
          this.submitAction(input as TutorialEngineInput);
        }
      }
    } else {
      if (!Number.isInteger(history) || history < 0 || history > tutorialSteps.length) throw new Error('教学进度记录无效。');
      for (let step = 0; step < history; step++) this.perform(step);
    }
  }

  get state(): State { return this.store.state; }

  /** Check an actual highlighted card/zone intent before touching the engine. */
  public submit(input: TutorialInput): void {
    const instruction = tutorialSteps[input.step];
    if (input.step !== this.completedSteps || !instruction || input.action !== instruction.id) throw new Error('请先完成当前高亮的教学操作。');
    if (instruction.target === 'hand') {
      const card = this.state.players[0].hand.cards.find(item => item.id === input.cardId);
      if (!card || card.fullName !== instruction.cardFullName) throw new Error('请选择当前提示的那张手牌。');
    }
    if (instruction.target === 'prizes' && (!Number.isInteger(input.prizeIndex) || input.prizeIndex! < 0 || input.prizeIndex! > 5 || !this.state.players[0].prizes[input.prizeIndex!]?.cards.length)) {
      throw new Error('请选择一张仍未拿取的奖赏卡。');
    }
    this.perform(input.step, input.cardId, input.prizeIndex);
  }

  /** Validate both the lesson's target and the engine's prompt before dispatching. */
  public submitAction(input: TutorialEngineInput): void {
    const instruction = tutorialSteps[this.completedSteps];
    if (!instruction || input.step !== this.completedSteps || !input.action || typeof input.action !== 'object') {
      throw new Error('请按当前教学提示操作。');
    }
    const action = input.action;
    const p = this.state.players[0];
    const id = instruction.id;
    const reject = () => { throw new Error('这一步请按教学说明选择卡牌和落点，再确认。'); };
    const ownTarget = (target: CardTarget, slot: SlotType) => target && target.player === PlayerType.BOTTOM_PLAYER && target.slot === slot &&
      Number.isInteger(target.index) && (slot === SlotType.BENCH ? target.index >= 0 && target.index < p.bench.length : target.index === 0);
    switch (action.type) {
      case 'playCard': {
        const card = Number.isInteger(action.handIndex) && p.hand.cards[action.handIndex];
        if (instruction.target !== 'hand' || id === 'setup' || !card || card.fullName !== instruction.cardFullName) reject();
        const slot = id === 'bench' || id === 'evolve' || id === 'energy-bench' ? SlotType.BENCH :
          id === 'potion' || id === 'supporter' ? SlotType.BOARD : SlotType.ACTIVE;
        // Items/supporters may be dropped on the mat or a friendly slot in the live board.
        // This is not their effect target: Potion still creates a separate ChoosePokemonPrompt.
        const legalDrop = slot === SlotType.BOARD ? [SlotType.BOARD, SlotType.ACTIVE, SlotType.BENCH].some(zone => ownTarget(action.target, zone)) : ownTarget(action.target, slot);
        if (!legalDrop) reject();
        if (slot === SlotType.BENCH) {
          const name = p.bench[action.target.index].getPokemonCard()?.fullName;
          if (id === 'bench' ? !!name : name !== (id === 'evolve' ? BASIC : EVOLUTION)) reject();
        }
        this.store.dispatch(new PlayCardAction(YOU, action.handIndex, action.target));
        break;
      }
      case 'resolvePrompt': {
        const prompt = this.state.prompts.find(item => item.id === action.id && item.playerId === YOU && item.result === undefined);
        if (!Number.isInteger(action.id) || !prompt || action.result === null || action.result === undefined) reject();
        const pending = prompt!;
        // Decode once before any engine mutation; whitelist the decoded object identity.
        const result = pending.decode(action.result, this.state);
        if (!pending.validate(result, this.state)) reject();
        if (pending instanceof ConfirmPrompt) {
          if (action.result !== true) reject();
        } else if (id === 'setup' && pending instanceof ChooseStartingPokemonPrompt) {
          if (result.active?.fullName !== EEVEE || result.bench.some((card: unknown) => card !== null)) reject();
        } else if ((id === 'heal' || id === 'retreat') && pending instanceof ChoosePokemonPrompt) {
          const expected = id === 'heal' ? p.active : p.bench.find(list => list.getPokemonCard()?.fullName === EVOLUTION);
          const raw = action.result;
          const slot = id === 'heal' ? SlotType.ACTIVE : SlotType.BENCH;
          if (!Array.isArray(raw) || raw.length !== 1 || !ownTarget(raw[0], slot) ||
            !Array.isArray(result) || result.length !== 1 || result[0] !== expected) reject();
        } else if (id === 'retreat' && pending instanceof ChooseEnergyPrompt) {
          const raw = action.result;
          if (!Array.isArray(raw) || new Set(raw).size !== raw.length || raw.some(index => !Number.isInteger(index) || index < 0 || index >= pending.energy.length) ||
            !Array.isArray(result) || result.some(item => !p.active.cards.includes(item.card))) reject();
        } else if (id === 'prize' && pending instanceof ChoosePrizePrompt) {
          const raw = action.result;
          if (!Array.isArray(raw) || raw.some(index => !Number.isInteger(index) || index < 0 || index >= p.getPrizeLeft())) reject();
          // Engine also validates count, uniqueness and available prizes.
        } else reject();
        this.store.dispatch(new ResolvePromptAction(pending.id, result));
        break;
      }
      case 'retreatStart':
        if (id !== 'retreat') reject();
        this.store.dispatch(new RetreatStartAction(YOU));
        break;
      case 'retreat':
        if (id !== 'retreat' || !Number.isInteger(action.to) || p.bench[action.to]?.getPokemonCard()?.fullName !== EVOLUTION) reject();
        this.store.dispatch(new RetreatAction(YOU, action.to));
        break;
      case 'attack':
        if (instruction.target !== 'attack' || action.attack !== 'Electric Ball') reject();
        this.store.dispatch(new AttackAction(YOU, action.attack));
        break;
      case 'passTurn':
        if (id !== 'first-pass' && id !== 'charge-pass') reject();
        this.store.dispatch(new PassTurnAction(YOU));
        break;
      default: reject();
    }
    this.flush();
    const pending = this.state.prompts.filter(prompt => prompt.playerId === YOU && prompt.result === undefined);
    const lessonBoundary = id === 'potion' && pending.some(prompt => prompt instanceof ChoosePokemonPrompt) ||
      id === 'attack-knockout' && pending.some(prompt => prompt instanceof ChoosePrizePrompt);
    if (pending.length && !lessonBoundary) return;
    this.assertResult(id);
    this.completedSteps++;
  }

  public instruction(): TutorialStep | null {
    const step = tutorialSteps[this.completedSteps];
    if (!step) return null;
    const prompt = this.state.prompts.find(p => p.playerId === YOU && p.result === undefined);
    const description = prompt instanceof ConfirmPrompt ? '在正式对局提示中确认先攻，随后拖动伊布到战斗区并确认预备牌阵。' :
      prompt instanceof ChooseStartingPokemonPrompt ? '把伊布从手牌拖到战斗区，备战区暂时留空，然后点击右下确认键。小磁怪会在下一步上场。' :
      prompt instanceof ChoosePokemonPrompt ? (step.id === 'retreat' ? '撤退费用已按正式规则支付。选择备战区的三合一磁怪，再点击右下确认键；确认前本步不会完成。' : '选择战斗区受伤的伊布，再点击右下确认键应用伤药。') :
      prompt instanceof ChooseEnergyPrompt ? '选择用于支付撤退费用的能量，再点击确认；之后还需要选择替补宝可梦并确认。' :
      prompt instanceof ChoosePrizePrompt ? '选择一张自己的背面奖赏卡，再点击右下确认键。' : step.description;
    return { ...step, description };
  }

  /** The exact same sanitized wire format consumed by the live table. */
  public gameState(): GameState {
    const state = StateSanitizer.sanitizeForViewer(this.state, { playerId: YOU, roleId: 0 });
    return { gameId: -1, stateData: new Base64().encode(new StateSerializer().serialize(state)),
      clientIds: [YOU, COACH], timeLimit: 0, recordingEnabled: false, playerStats: [], format: Format.UNLIMITED };
  }

  private resolve(prompt: Prompt<any>, raw: unknown): void {
    const result = prompt.decode(raw, this.state);
    if (!prompt.validate(result, this.state)) throw new Error('教学提示的选择无效。');
    this.store.dispatch(new ResolvePromptAction(prompt.id, result));
  }

  private play(name: string, slot: SlotType, index = 0, cardId?: number): void {
    const hand = this.state.players[0].hand.cards;
    const handIndex = hand.findIndex(card => card.fullName === name && (cardId === undefined || card.id === cardId));
    if (handIndex < 0) throw new Error('教学所需卡牌不在手牌中。');
    this.store.dispatch(new PlayCardAction(YOU, handIndex, { player: PlayerType.BOTTOM_PLAYER, slot, index }));
  }

  private perform(step: number, cardId?: number, prizeIndex?: number): void {
    const instruction = tutorialSteps[step];
    const player = this.state.players[0];
    switch (instruction.id) {
      case 'setup': {
        const prompt = this.state.prompts.find(p => p instanceof ChooseStartingPokemonPrompt && p.playerId === YOU && p.result === undefined);
        if (!prompt) throw new Error('开局教学提示不存在。');
        const active = player.hand.cards.findIndex(c => c.fullName === EEVEE);
        this.resolve(prompt, { active, bench: Array(5).fill(null) }); break;
      }
      case 'bench': this.play(BASIC, SlotType.BENCH, 0, cardId); break;
      case 'energy-active': case 'energy-second': this.play(ENERGY, SlotType.ACTIVE, 0, cardId); break;
      case 'first-pass': case 'charge-pass': this.store.dispatch(new PassTurnAction(YOU)); break;
      case 'potion': this.play(POTION, SlotType.BOARD, 0, cardId); break;
      case 'heal': {
        const prompt = this.state.prompts.find(p => p instanceof ChoosePokemonPrompt && p.playerId === YOU && p.result === undefined);
        if (!prompt) throw new Error('回复目标的提示不存在。');
        this.resolve(prompt, [{ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 }]); break;
      }
      case 'supporter': this.play(SUPPORTER, SlotType.BOARD, 0, cardId); break;
      case 'evolve': this.play(EVOLUTION, SlotType.BENCH, 0, cardId); break;
      case 'energy-bench': this.play(ENERGY, SlotType.BENCH, 0, cardId); break;
      case 'retreat': this.store.dispatch(new RetreatAction(YOU, 0)); break;
      case 'prize': {
        const prompt = this.state.prompts.find(p => p instanceof ChoosePrizePrompt && p.playerId === YOU && p.result === undefined);
        if (!prompt) throw new Error('拿取奖赏的提示不存在。');
        const remaining = player.prizes.map((p, index) => ({ p, index })).filter(x => x.p.cards.length);
        this.resolve(prompt, [prizeIndex === undefined ? 0 : remaining.findIndex(x => x.index === prizeIndex)]); break;
      }
      default: this.store.dispatch(new AttackAction(YOU, 'Electric Ball'));
    }
    this.flush(true);
    this.assertResult(instruction.id);
    this.completedSteps++;
  }

  /** Deterministic arbitration and bot decisions are scoped to this private Store. */
  private flush(legacy = false): void {
    for (let guard = 0; guard < 100; guard++) {
      const pending = this.state.prompts.filter(p => p.result === undefined);
      const automatic = pending.find(p => p instanceof ShuffleDeckPrompt || p instanceof CoinFlipPrompt || (legacy && p instanceof ConfirmPrompt) || p instanceof WaitPrompt || p.playerId === COACH);
      if (automatic) {
        if (automatic instanceof ShuffleDeckPrompt) {
          const owner = this.state.players.find(p => p.id === automatic.getPerspectivePlayerId())!;
          this.resolve(automatic, owner.deck.cards.map((_, index) => index));
        } else if (automatic instanceof CoinFlipPrompt || automatic instanceof ConfirmPrompt || automatic instanceof WaitPrompt) {
          this.resolve(automatic, true);
        } else if (automatic instanceof ChooseStartingPokemonPrompt) {
          this.resolve(automatic, { active: 0, bench: [1, null, null, null, null] });
        } else if (automatic instanceof ChoosePokemonPrompt) {
          this.resolve(automatic, [{ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: this.state.players[1].bench.findIndex(b => !!b.getPokemonCard()) }]);
        } else {
          throw new Error(`教学电脑遇到未配置提示：${automatic.type}`);
        }
        continue;
      }
      if (pending.length || this.state.phase !== GamePhase.PLAYER_TURN || this.state.players[this.state.activePlayer].id !== COACH) return;
      const bot = this.state.players[1];
      if (!this.botEnergyTurns.has(this.state.turn)) {
        this.botEnergyTurns.add(this.state.turn);
        const handIndex = bot.hand.cards.findIndex(c => c.fullName === ENERGY);
        // Prepare the benched second Pawmi once the first already has energy.
        const targetBench = bot.active.cards.some(c => c.superType === SuperType.ENERGY) && !!bot.bench[0].getPokemonCard() && !bot.bench[0].cards.some(c => c.superType === SuperType.ENERGY);
        if (handIndex >= 0 && (targetBench || !bot.active.cards.some(c => c.superType === SuperType.ENERGY))) {
          this.store.dispatch(new PlayCardAction(COACH, handIndex, { player: PlayerType.BOTTOM_PLAYER, slot: targetBench ? SlotType.BENCH : SlotType.ACTIVE, index: 0 }));
          continue;
        }
      }
      this.store.dispatch(new AttackAction(COACH, 'Light Punch'));
    }
    throw new Error('教学脚本未能推进，已停止以保护对局。');
  }

  private assertResult(id: string): void {
    const p = this.state.players[0];
    const opponent = this.state.players[1];
    const has = (list: PokemonCardList, name: string) => list.getPokemonCard()?.fullName === name;
    const energies = (list: PokemonCardList) => list.cards.filter(c => c.superType === SuperType.ENERGY).length;
    const results: Record<string, () => boolean> = {
      setup: () => has(p.active, EEVEE) && p.getPrizeLeft() === 6 && this.state.turn === 1,
      bench: () => p.bench.some(list => has(list, BASIC)),
      'energy-active': () => energies(p.active) === 1,
      'first-pass': () => this.state.turn === 3 && p.active.damage === 10,
      potion: () => this.state.prompts.some(prompt => prompt instanceof ChoosePokemonPrompt && prompt.result === undefined),
      heal: () => p.active.damage === 0 && !p.hand.cards.some(c => c.fullName === POTION) && p.discard.cards.some(c => c.fullName === POTION),
      // After Potion: 5 cards. Playing Nemona consumes 1 and draws 3, leaving 7.
      supporter: () => [...p.supporter.cards, ...p.discard.cards].some(c => c.fullName === SUPPORTER) && p.supporterTurn === 1 && p.hand.cards.length === 7,
      evolve: () => p.bench.some(list => has(list, EVOLUTION)),
      'energy-bench': () => p.bench.some(list => has(list, EVOLUTION) && energies(list) === 1),
      retreat: () => has(p.active, EVOLUTION) && energies(p.active) === 1 && p.discard.cards.some(c => c.fullName === ENERGY),
      'charge-pass': () => this.state.turn === 5 && p.active.damage === 10,
      'energy-second': () => energies(p.active) === 2,
      'attack-first': () => opponent.active.damage === 40 && this.state.turn === 7,
      'attack-knockout': () => this.state.prompts.some(prompt => prompt instanceof ChoosePrizePrompt && prompt.result === undefined),
      prize: () => p.getPrizeLeft() === 5 && has(opponent.active, OPPONENT) && this.state.turn === 9,
      'attack-last-first': () => opponent.active.damage === 40 && this.state.turn === 11,
      'attack-last': () => this.state.phase === GamePhase.FINISHED && this.state.winner === GameWinner.PLAYER_1 && p.getPrizeLeft() === 4,
    };
    if (!results[id]?.()) throw new Error(`教学操作未达到预期：${id}`);
  }

  public snapshot() {
    const card = (c: { id: number; fullName: string; name: string }) => {
      const free = FREE_BASIC_ENERGIES.find(p => p.engineFullName === c.fullName);
      return { id: c.id, fullName: c.fullName, name: c.name, ...(free ? { printingId: free.printingId, image: free.image } : {}) };
    };
    const pokemon = (list: PokemonCardList) => {
      const c = list.getPokemonCard();
      return c ? { ...card(c), hp: c.hp, damage: list.damage, energies: list.cards.filter(item => item.superType === SuperType.ENERGY).map(card), evolution: list.cards.filter(item => item instanceof PokemonCard).map(card) } : null;
    };
    const player = (index: number) => {
      const p = this.state.players[index];
      return { active: pokemon(p.active), bench: p.bench.map(pokemon), handCount: p.hand.cards.length, deckCount: p.deck.cards.length, prizeCount: p.getPrizeLeft(), discard: p.discard.cards.map(card) };
    };
    return { phase: this.state.phase === GamePhase.FINISHED ? 'finished' : this.state.phase === GamePhase.SETUP ? 'setup' : 'turn', turn: this.state.turn, activePlayer: this.state.activePlayer === 0 ? 'you' : 'coach', hand: this.state.players[0].hand.cards.map(card), self: player(0), opponent: player(1), prizes: this.state.players[0].prizes.map(p => p.cards.length > 0), winner: this.state.winner === GameWinner.PLAYER_1 ? 'you' : null };
  }
}
