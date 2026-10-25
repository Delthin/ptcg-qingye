import {
  CardType, GamePhase, SpecialCondition, StateUtils, SuperType,
  type Attack, type EnergyCard, type Player, type PokemonCardList, type State,
} from 'ptcg-server';

const ENERGY_NAMES: Partial<Record<CardType, string>> = {
  [CardType.GRASS]: '草', [CardType.FIRE]: '火', [CardType.WATER]: '水',
  [CardType.LIGHTNING]: '雷', [CardType.PSYCHIC]: '超', [CardType.FIGHTING]: '斗',
  [CardType.DARK]: '恶', [CardType.METAL]: '钢', [CardType.COLORLESS]: '无色',
  [CardType.FAIRY]: '妖精', [CardType.DRAGON]: '龙',
};

/** Certain public rule locks; only the fixed tutorial has unmodified printed energy costs. */
export function attackBlockReasons(state: State, player: Player, source: PokemonCardList,
  attacks: Attack[], tutorial = false): Record<string, string> {
  const reasons: Record<string, string> = {};
  for (const attack of attacks) {
    let reason = '';
    if (state.phase !== GamePhase.PLAYER_TURN || state.players[state.activePlayer]?.id !== player.id) {
      reason = '当前不是你的行动回合';
    } else if (state.prompts.some(prompt => prompt.result === undefined)) {
      reason = '请先完成当前选择';
    } else if (source !== player.active && !attack.useOnBench) {
      reason = '此招式只能在战斗区使用';
    } else if (state.turn === 1 && !state.rules.attackFirstTurn && !attack.canUseOnFirstTurn) {
      reason = '先攻首回合不能使用此招式';
    } else if (player.active.specialConditions.includes(SpecialCondition.ASLEEP) ||
      player.active.specialConditions.includes(SpecialCondition.PARALYZED)) {
      reason = '睡眠或麻痹状态下不能攻击';
    } else if (source.cannotAttackNextTurn || player.cannotAttackTurnsRemaining > 0 ||
      source.cannotUseAttacksNextTurn.includes(attack.name) ||
      source.blockedAttackNameNextTurn === attack.name ||
      source.blockedAttackNameUntilLeavesActive === attack.name ||
      (source.onlyAllowedAttackNameNextTurn !== undefined && source.onlyAllowedAttackNameNextTurn !== attack.name)) {
      reason = '当前卡牌效果禁止使用此招式';
    } else if (tutorial) {
      // Formal games can alter costs/provided Energy through abilities, tools and effects.
      // Do not mis-disable those attacks by guessing from printed metadata on the client.
      const energyMap = source.cards.filter(card => card.superType === SuperType.ENERGY)
        .map(card => ({ card, provides: (card as EnergyCard).provides }));
      if (!StateUtils.checkEnoughEnergy(energyMap, attack.cost)) {
        const provides = energyMap.flatMap(item => item.provides);
        const missing: CardType[] = [];
        for (const cost of attack.cost.filter(type => type !== CardType.COLORLESS && type !== CardType.ANY && type !== CardType.NONE)) {
          const index = provides.indexOf(cost);
          if (index >= 0) provides.splice(index, 1); else missing.push(cost);
        }
        const colorless = attack.cost.filter(type => type === CardType.COLORLESS).length;
        for (let i = provides.length; i < colorless; i++) missing.push(CardType.COLORLESS);
        reason = `能量不足：还缺${missing.map(type => ` 1 个${ENERGY_NAMES[type] ?? '指定属性'}能量费用`).join('、')}`;
      }
    }
    if (reason) reasons[attack.name] = reason;
  }
  return reasons;
}
