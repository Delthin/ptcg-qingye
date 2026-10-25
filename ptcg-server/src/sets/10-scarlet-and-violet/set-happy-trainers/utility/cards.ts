import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, CardTag, Stage, SpecialCondition, SuperType } from '../../../../game/store/card/card-types';
import { PowerType } from '../../../../game/store/card/pokemon-types';
import { Card } from '../../../../game/store/card/card';
import { Effect } from '../../../../game/store/effects/effect';
import { HealEffect } from '../../../../game/store/effects/game-effects';
import { CheckProvidedEnergyEffect } from '../../../../game/store/effects/check-effects';
import { AddSpecialConditionsEffect, PutDamageEffect } from '../../../../game/store/effects/attack-effects';
import { ChoosePokemonPrompt } from '../../../../game/store/prompts/choose-pokemon-prompt';
import { MoveEnergyPrompt } from '../../../../game/store/prompts/move-energy-prompt';
import { PlayerType, SlotType } from '../../../../game/store/actions/play-card-action';
import { PokemonCardList } from '../../../../game/store/state/pokemon-card-list';
import { StateUtils } from '../../../../game/store/state-utils';
import { State } from '../../../../game/store/state/state';
import { StoreLike } from '../../../../game/store/store-like';
import { GameError } from '../../../../game/game-error';
import { GameMessage } from '../../../../game/game-message';
import {
  AFTER_ATTACK, COIN_FLIP_PROMPT, CONFIRMATION_PROMPT, DRAW_CARDS,
  HEAL_X_DAMAGE_FROM_THIS_POKEMON, IS_ABILITY_BLOCKED, MULTIPLE_COIN_FLIPS_PROMPT,
  SWITCH_OUT_OPPONENT_ACTIVE_POKEMON, THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN,
  WAS_ATTACK_USED, WAS_POWER_USED, WAS_POKEMON_KNOCKED_OUT_DURING_OPPONENTS_LAST_TURN
} from '../../../../game/store/prefabs/prefabs';
import { NEXT_TURN_ATTACK_BONUS_ALL_ATTACKS } from '../../../../game/store/prefabs/attack-effects';
import { BLOCK_RETREAT, BLOCK_SELF_RETREAT, FLIP_COIN_TO_PREVENT_DAMAGE_AND_EFFECTS_DURING_OPPONENTS_NEXT_TURN } from '../../../../game/store/prefabs/effect-of-attack-prefabs';

// Printed data: data/source/ptcg_chs_infos.json, CSVH6eC / CSVH6pC.

export class Happy6AlolanMarowak extends PokemonCard {
  public stage = Stage.STAGE_1;
  public cardType = [CardType.PSYCHIC];
  public hp = 120;
  public weakness = [{ type: CardType.DARK }];
  public resistance = [{ type: CardType.FIGHTING, value: -30 }];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];
  public evolvesFrom = "Cubone";
  public attacks = [
    {
      name: "报仇",
      cost: [CardType.PSYCHIC],
      damage: 30,
      damageCalculation: '+',
      text: "在上一个对手的回合，如果因为招式的伤害，而导致自己的宝可梦【昏厥】的话，则追加造成90伤害。"
    },
    {
      name: "磷火",
      cost: [CardType.PSYCHIC, CardType.COLORLESS, CardType.COLORLESS],
      damage: 90,
      text: ""
    },
  ];
  public regulationMark = "H";
  public set = "CSVH6eC";
  public setNumber = "022";
  public name = "Alolan Marowak";
  public fullName = "Alolan Marowak CSVH6eC";
  public cardImage = "assets/cardback.png";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)
      && WAS_POKEMON_KNOCKED_OUT_DURING_OPPONENTS_LAST_TURN(effect.player, { byAttackDamage: true })) {
      effect.damage += 90;
    }
    return state;
  }
}

export class Happy6Sigilyph extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.PSYCHIC];
  public hp = 110;
  public weakness = [{ type: CardType.LIGHTNING }];
  public resistance = [{ type: CardType.FIGHTING, value: -30 }];
  public retreat = [CardType.COLORLESS];
  public attacks = [
    {
      name: "双重抽取",
      cost: [CardType.COLORLESS],
      damage: 0,
      text: "从自己牌库上方抽取2张卡牌。"
    },
    {
      name: "念力",
      cost: [CardType.PSYCHIC, CardType.COLORLESS, CardType.COLORLESS],
      damage: 60,
      text: "抛掷1次硬币如果为正面，则令对手的战斗宝可梦陷入【麻痹】状态。"
    },
  ];
  public regulationMark = "H";
  public set = "CSVH6eC";
  public setNumber = "023";
  public name = "Sigilyph";
  public fullName = "Sigilyph CSVH6eC";
  public cardImage = "assets/cardback.png";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      effect.afterDamageEffects.push(state => DRAW_CARDS(store, state, effect.player, 2));
    }
    if (WAS_ATTACK_USED(effect, 1, this)) {
      effect.afterDamageEffects.push(state => COIN_FLIP_PROMPT(store, state, effect.player, heads => {
        if (heads) store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.PARALYZED]));
      }));
    }
    return state;
  }
}

export class Happy6Elgyem extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.PSYCHIC];
  public hp = 60;
  public weakness = [{ type: CardType.DARK }];
  public resistance = [{ type: CardType.FIGHTING, value: -30 }];
  public retreat = [CardType.COLORLESS];
  public attacks = [
    {
      name: "躲藏",
      cost: [CardType.PSYCHIC],
      damage: 0,
      text: "抛掷1次硬币如果为正面，则在下一个对手的回合，这只宝可梦不受到招式的伤害和效果影响。"
    },
  ];
  public regulationMark = "H";
  public set = "CSVH6eC";
  public setNumber = "024";
  public name = "Elgyem";
  public fullName = "Elgyem CSVH6eC";
  public cardImage = "assets/cardback.png";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return FLIP_COIN_TO_PREVENT_DAMAGE_AND_EFFECTS_DURING_OPPONENTS_NEXT_TURN(store, state, effect, this);
    }
    return state;
  }
}

export class Happy6Beheeyem extends PokemonCard {
  public stage = Stage.STAGE_1;
  public cardType = [CardType.PSYCHIC];
  public hp = 100;
  public weakness = [{ type: CardType.DARK }];
  public resistance = [{ type: CardType.FIGHTING, value: -30 }];
  public retreat = [CardType.COLORLESS];
  public evolvesFrom = "Elgyem";
  public attacks = [
    {
      name: "宇宙打击",
      cost: [CardType.PSYCHIC],
      damage: 20,
      damageCalculation: 'x',
      text: "造成自己场上的宝可梦数量×20伤害。"
    },
  ];
  public regulationMark = "H";
  public set = "CSVH6eC";
  public setNumber = "025";
  public name = "Beheeyem";
  public fullName = "Beheeyem CSVH6eC";
  public cardImage = "assets/cardback.png";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      let count = 0;
      effect.player.forEachPokemon(PlayerType.BOTTOM_PLAYER, () => count++);
      effect.damage = count * 20;
    }
    return state;
  }
}

export class Happy6Milcery extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.PSYCHIC];
  public hp = 50;
  public weakness = [{ type: CardType.METAL }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public attacks = [
    {
      name: "撞击",
      cost: [CardType.COLORLESS],
      damage: 20,
      text: ""
    },
  ];
  public regulationMark = "H";
  public set = "CSVH6eC";
  public setNumber = "027";
  public name = "Milcery";
  public fullName = "Milcery CSVH6eC";
  public cardImage = "assets/cardback.png";
}

export class Happy6Sandshrew extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.FIGHTING];
  public hp = 60;
  public weakness = [{ type: CardType.GRASS }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public attacks = [
    {
      name: "滚动",
      cost: [CardType.COLORLESS],
      damage: 10,
      text: ""
    },
    {
      name: "双重抓",
      cost: [CardType.FIGHTING, CardType.COLORLESS],
      damage: 20,
      damageCalculation: 'x',
      text: "抛掷2次硬币，造成正面次数×20伤害。"
    },
  ];
  public regulationMark = "H";
  public set = "CSVH6eC";
  public setNumber = "028";
  public name = "Sandshrew";
  public fullName = "Sandshrew CSVH6eC";
  public cardImage = "assets/cardback.png";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      return MULTIPLE_COIN_FLIPS_PROMPT(store, state, effect.player, 2, results => {
        effect.damage = results.filter(Boolean).length * 20;
      });
    }
    return state;
  }
}

export class Happy6Sandslash extends PokemonCard {
  public stage = Stage.STAGE_1;
  public cardType = [CardType.FIGHTING];
  public hp = 120;
  public weakness = [{ type: CardType.GRASS }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public evolvesFrom = "Sandshrew";
  public attacks = [
    {
      name: "亮爪",
      cost: [CardType.COLORLESS],
      damage: 30,
      text: ""
    },
    {
      name: "地震",
      cost: [CardType.FIGHTING, CardType.COLORLESS],
      damage: 120,
      text: "给自己所有备战宝可梦，也各造成10伤害。[备战宝可梦不计算弱点、抗性。]"
    },
  ];
  public regulationMark = "H";
  public set = "CSVH6eC";
  public setNumber = "029";
  public name = "Sandslash";
  public fullName = "Sandslash CSVH6eC";
  public cardImage = "assets/cardback.png";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      effect.additionalDamageEffects.push(state => {
        for (const target of effect.player.bench) {
          if (target.cards.length === 0) continue;
          const damage = new PutDamageEffect(effect, 10);
          damage.target = target;
          state = store.reduceEffect(state, damage);
        }
        return state;
      });
    }
    return state;
  }
}

export class Happy6Cubone extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.FIGHTING];
  public hp = 70;
  public weakness = [{ type: CardType.GRASS }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public attacks = [
    {
      name: "踩",
      cost: [CardType.COLORLESS],
      damage: 10,
      text: ""
    },
    {
      name: "殴打",
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: 20,
      text: ""
    },
  ];
  public regulationMark = "H";
  public set = "CSVH6eC";
  public setNumber = "030";
  public name = "Cubone";
  public fullName = "Cubone CSVH6eC";
  public cardImage = "assets/cardback.png";
}

export class Happy6Meditite extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.FIGHTING];
  public hp = 70;
  public weakness = [{ type: CardType.PSYCHIC }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public attacks = [
    {
      name: "连攻重拳",
      cost: [CardType.FIGHTING],
      damage: 10,
      damageCalculation: '+',
      text: "抛掷1次硬币，如果为正面，则追加造成20伤害。"
    },
  ];
  public regulationMark = "I";
  public set = "CSVH6eC";
  public setNumber = "031";
  public name = "Meditite";
  public fullName = "Meditite CSVH6eC";
  public cardImage = "assets/cardback.png";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return COIN_FLIP_PROMPT(store, state, effect.player, heads => {
        if (heads) effect.damage += 20;
      });
    }
    return state;
  }
}

export class Happy6Medicham extends PokemonCard {
  public stage = Stage.STAGE_1;
  public cardType = [CardType.FIGHTING];
  public hp = 120;
  public weakness = [{ type: CardType.PSYCHIC }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public evolvesFrom = "Meditite";
  public attacks = [
    {
      name: "合气掌",
      cost: [CardType.FIGHTING],
      damage: 50,
      damageCalculation: '+',
      text: "如果这只宝可梦身上附着的能量数量与对手战斗宝可梦身上附着的能量数量相同的话，则追加造成120伤害。"
    },
  ];
  public regulationMark = "I";
  public set = "CSVH6eC";
  public setNumber = "032";
  public name = "Medicham";
  public fullName = "Medicham CSVH6eC";
  public cardImage = "assets/cardback.png";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const own = new CheckProvidedEnergyEffect(effect.player, effect.source);
      const opposing = new CheckProvidedEnergyEffect(effect.opponent, effect.opponent.active);
      store.reduceEffect(state, own);
      store.reduceEffect(state, opposing);
      const ownCount = own.energyMap.reduce((count, entry) => count + entry.provides.length, 0);
      const opposingCount = opposing.energyMap.reduce((count, entry) => count + entry.provides.length, 0);
      if (ownCount === opposingCount) effect.damage += 120;
    }
    return state;
  }
}

export class Happy6Lokix extends PokemonCard {
  public stage = Stage.STAGE_1;
  public cardType = [CardType.DARK];
  public hp = 120;
  public weakness = [{ type: CardType.GRASS }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public evolvesFrom = "Nymble";
  public attacks = [
    {
      name: "下盘踢",
      cost: [CardType.DARK],
      damage: 60,
      text: ""
    },
  ];
  public regulationMark = "H";
  public set = "CSVH6eC";
  public setNumber = "035";
  public name = "Lokix";
  public fullName = "Lokix CSVH6eC";
  public cardImage = "assets/cardback.png";
}

export class Happy6Forretress extends PokemonCard {
  public stage = Stage.STAGE_1;
  public cardType = [CardType.METAL];
  public hp = 130;
  public weakness = [{ type: CardType.FIRE }];
  public resistance = [{ type: CardType.GRASS, value: -30 }];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];
  public evolvesFrom = "Pineco";
  public attacks = [
    {
      name: "钢铁震撼",
      cost: [CardType.COLORLESS],
      damage: 20,
      text: "选择自己场上的宝可梦身上附着的任意数量的【钢】能量，以任意方式转附于自己的宝可梦身上。"
    },
    {
      name: "飓风针刺",
      cost: [CardType.METAL, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
      damage: 80,
      damageCalculation: 'x',
      text: "抛掷4次硬币，造成正面次数×80伤害。"
    },
  ];
  public regulationMark = "I";
  public set = "CSVH6eC";
  public setNumber = "036";
  public name = "Forretress";
  public fullName = "Forretress CSVH6eC";
  public cardImage = "assets/cardback.png";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      effect.afterDamageEffects.push(state => {
      const player = effect.player;
      const eligible = new Map<PokemonCardList, Card[]>();
      const blockedMap: { source: import('../../../../game/store/actions/play-card-action').CardTarget; blocked: number[] }[] = [];
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (list, card, target) => {
        const energy = new CheckProvidedEnergyEffect(player, list);
        store.reduceEffect(state, energy);
        const allowed = energy.energyMap.filter(entry => entry.provides.includes(CardType.METAL)
          || entry.provides.includes(CardType.ANY)).map(entry => entry.card);
        eligible.set(list, allowed);
        blockedMap.push({ source: target, blocked: list.cards.map((c, i) => allowed.includes(c) ? -1 : i).filter(i => i >= 0) });
      });
      if (![...eligible.values()].some(allowed => allowed.length > 0)) return state;
      return store.prompt(state, new MoveEnergyPrompt(player.id, GameMessage.MOVE_ENERGY_CARDS,
        PlayerType.BOTTOM_PLAYER, [SlotType.ACTIVE, SlotType.BENCH], { superType: SuperType.ENERGY },
        { min: 0, allowCancel: false, blockedMap }), transfers => {
        if (transfers === null) throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
        // Validate the entire plan before moving any card: this prompt's base validator
        // only checks card existence, not ownership, energy type, or duplicate transfers.
        const seen = new Set<Card>();
        for (const transfer of transfers) {
          const from = StateUtils.getTarget(state, player, transfer.from);
          const to = StateUtils.getTarget(state, player, transfer.to);
          if (transfer.from.player !== PlayerType.BOTTOM_PLAYER || transfer.to.player !== PlayerType.BOTTOM_PLAYER
            || !eligible.has(from) || !eligible.has(to) || from === to
            || !eligible.get(from)!.includes(transfer.card) || !from.cards.includes(transfer.card)
            || seen.has(transfer.card)) throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
          seen.add(transfer.card);
        }
        for (const transfer of transfers) {
          StateUtils.getTarget(state, player, transfer.from).moveCardTo(transfer.card, StateUtils.getTarget(state, player, transfer.to));
        }
      });
      });
    }
    if (WAS_ATTACK_USED(effect, 1, this)) {
      return MULTIPLE_COIN_FLIPS_PROMPT(store, state, effect.player, 4, results => {
        effect.damage = results.filter(Boolean).length * 80;
      });
    }
    return state;
  }
}

export class Happy6Skarmory extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.METAL];
  public hp = 110;
  public weakness = [{ type: CardType.LIGHTNING }];
  public resistance = [{ type: CardType.FIGHTING, value: -30 }];
  public retreat = [CardType.COLORLESS];
  public attacks = [
    {
      name: "羽栖",
      cost: [CardType.COLORLESS],
      damage: 0,
      text: "回复这只宝可梦「50」HP。在下一个自己的回合，这只宝可梦无法撤退。"
    },
    {
      name: "金属爪",
      cost: [CardType.METAL, CardType.COLORLESS],
      damage: 60,
      text: ""
    },
  ];
  public regulationMark = "I";
  public set = "CSVH6eC";
  public setNumber = "037";
  public name = "Skarmory";
  public fullName = "Skarmory CSVH6eC";
  public cardImage = "assets/cardback.png";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      effect.afterDamageEffects.push(state => {
        state = HEAL_X_DAMAGE_FROM_THIS_POKEMON(effect, store, state, 50);
        return BLOCK_SELF_RETREAT(store, state, effect, this);
      });
    }
    return state;
  }
}

export class Happy6Taillow extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.COLORLESS];
  public hp = 60;
  public weakness = [{ type: CardType.LIGHTNING }];
  public resistance = [{ type: CardType.FIGHTING, value: -30 }];
  public retreat = [CardType.COLORLESS];
  public attacks = [
    {
      name: "翅膀攻击",
      cost: [CardType.COLORLESS],
      damage: 20,
      text: ""
    },
  ];
  public regulationMark = "I";
  public set = "CSVH6eC";
  public setNumber = "038";
  public name = "Taillow";
  public fullName = "Taillow CSVH6eC";
  public cardImage = "assets/cardback.png";
}

export class Happy6Swellow extends PokemonCard {
  public stage = Stage.STAGE_1;
  public cardType = [CardType.COLORLESS];
  public hp = 100;
  public weakness = [{ type: CardType.LIGHTNING }];
  public resistance = [{ type: CardType.FIGHTING, value: -30 }];
  public retreat = [];
  public evolvesFrom = "Taillow";
  public attacks = [
    {
      name: "叼",
      cost: [CardType.COLORLESS],
      damage: 0,
      text: "从自己牌库上方抽取3张卡牌。"
    },
    {
      name: "高速之翼",
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: 70,
      text: ""
    },
  ];
  public regulationMark = "I";
  public set = "CSVH6eC";
  public setNumber = "039";
  public name = "Swellow";
  public fullName = "Swellow CSVH6eC";
  public cardImage = "assets/cardback.png";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      effect.afterDamageEffects.push(state => DRAW_CARDS(store, state, effect.player, 3));
    }
    return state;
  }
}

export class Happy6Minccino extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.COLORLESS];
  public hp = 70;
  public weakness = [{ type: CardType.FIGHTING }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public attacks = [
    {
      name: "巴掌",
      cost: [CardType.COLORLESS],
      damage: 20,
      text: ""
    },
  ];
  public regulationMark = "H";
  public set = "CSVH6eC";
  public setNumber = "040";
  public name = "Minccino";
  public fullName = "Minccino CSVH6eC";
  public cardImage = "assets/cardback.png";
}

export class Happy6Cinccino extends PokemonCard {
  public stage = Stage.STAGE_1;
  public cardType = [CardType.COLORLESS];
  public hp = 100;
  public weakness = [{ type: CardType.FIGHTING }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public evolvesFrom = "Minccino";
  public attacks = [
    {
      name: "尾巴敲打",
      cost: [CardType.COLORLESS],
      damage: 50,
      text: ""
    },
  ];
  public regulationMark = "H";
  public set = "CSVH6eC";
  public setNumber = "041";
  public name = "Cinccino";
  public fullName = "Cinccino CSVH6eC";
  public cardImage = "assets/cardback.png";
}

export class Happy6Komala extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.COLORLESS];
  public hp = 100;
  public weakness = [{ type: CardType.FIGHTING }];
  public resistance = [];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];
  public attacks = [
    {
      name: "晚安敲击",
      cost: [CardType.COLORLESS],
      damage: 30,
      text: "令双方的战斗宝可梦各陷入【睡眠】状态。在下一个自己的回合，这只宝可梦所使用的招式给对手战斗宝可梦造成的伤害「+100」。"
    },
  ];
  public regulationMark = "I";
  public set = "CSVH6eC";
  public setNumber = "042";
  public name = "Komala";
  public fullName = "Komala CSVH6eC";
  public cardImage = "assets/cardback.png";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    NEXT_TURN_ATTACK_BONUS_ALL_ATTACKS(effect, { source: this, setupAttack: this.attacks[0], bonusDamage: 100 });
    if (WAS_ATTACK_USED(effect, 0, this)) {
      effect.afterDamageEffects.push(state => {
        const ownSleep = new AddSpecialConditionsEffect(effect, [SpecialCondition.ASLEEP]);
        ownSleep.target = effect.source;
        state = store.reduceEffect(state, ownSleep);
        return store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.ASLEEP]));
      });
    }
    return state;
  }
}

export class Happy6Squawkabilly extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.COLORLESS];
  public hp = 70;
  public weakness = [{ type: CardType.LIGHTNING }];
  public resistance = [{ type: CardType.FIGHTING, value: -30 }];
  public retreat = [CardType.COLORLESS];
  public attacks = [
    {
      name: "撞飞",
      cost: [CardType.COLORLESS],
      damage: 20,
      text: "若希望，可以将对手的战斗宝可梦与备战宝可梦互换。[放于战斗场的宝可梦由对手选择。]"
    },
  ];
  public regulationMark = "I";
  public set = "CSVH6eC";
  public setNumber = "043";
  public name = "Squawkabilly";
  public fullName = "Squawkabilly CSVH6eC";
  public cardImage = "assets/cardback.png";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (AFTER_ATTACK(effect, 0, this) && effect.opponent.bench.some(list => list.cards.length > 0)) {
      return CONFIRMATION_PROMPT(store, state, effect.player, wantsSwitch => {
        if (wantsSwitch) SWITCH_OUT_OPPONENT_ACTIVE_POKEMON(store, state, effect.player, { sourceEffect: effect });
      }, GameMessage.WANT_TO_SWITCH_POKEMON);
    }
    return state;
  }
}

export class Happy6AlcremieEx extends PokemonCard {
  public stage = Stage.STAGE_1;
  public cardType = [CardType.PSYCHIC];
  public hp = 250;
  public weakness = [{ type: CardType.METAL }];
  public resistance = [];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];
  public evolvesFrom = "Milcery";
  protected _tags = [CardTag.POKEMON_ex];
  public attacks = [
    {
      name: "仙奶射击",
      cost: [CardType.PSYCHIC, CardType.COLORLESS, CardType.COLORLESS],
      damage: 160,
      text: ""
    },
  ];
  public powers = [{ name: "甜点赠礼", powerType: PowerType.ABILITY, useWhenInPlay: true, text: "在自己的回合可以使用1次。回复自己1只宝可梦「30」HP。" }];
  public readonly SWEET_GIFT_MARKER = "HAPPY6_SWEET_GIFT";
  public regulationMark = "H";
  public set = "CSVH6pC";
  public setNumber = "003";
  public name = "Alcremie ex";
  public fullName = "Alcremie ex CSVH6pC";
  public cardImage = "assets/cardback.png";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;
      if (IS_ABILITY_BLOCKED(store, state, player, this)) throw new GameError(GameMessage.CANNOT_USE_POWER);
      const source = [player.active, ...player.bench].find(list => list.getPokemonCard() === this);
      if (!source) throw new GameError(GameMessage.CANNOT_USE_POWER);
      if (source.inPlayAbilityUses.some(use => use.card === this
        && use.marker === this.SWEET_GIFT_MARKER && use.turn === state.turn)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }
      source.inPlayAbilityUses = source.inPlayAbilityUses.filter(use => use.turn === state.turn && source.cards.includes(use.card));
      source.inPlayAbilityUses.push({ card: this, marker: this.SWEET_GIFT_MARKER, turn: state.turn });
      return store.prompt(state, new ChoosePokemonPrompt(player.id, GameMessage.CHOOSE_POKEMON_TO_HEAL,
        PlayerType.BOTTOM_PLAYER, [SlotType.ACTIVE, SlotType.BENCH], { min: 1, max: 1, allowCancel: false }), targets => {
        if (!targets || targets.length !== 1 || ![player.active, ...player.bench].includes(targets[0])) {
          throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
        }
        store.reduceEffect(state, new HealEffect(player, targets[0], 30));
      });
    }
    return state;
  }
}

export class Happy6KoraidonEx extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.FIGHTING];
  public hp = 230;
  public weakness = [{ type: CardType.PSYCHIC }];
  public resistance = [];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];
  protected _tags = [CardTag.POKEMON_ex];
  public attacks = [
    {
      name: "利爪劈开",
      cost: [CardType.FIGHTING, CardType.COLORLESS],
      damage: 50,
      text: ""
    },
    {
      name: "复仇爆发",
      cost: [CardType.FIGHTING, CardType.FIGHTING, CardType.COLORLESS],
      damage: 100,
      damageCalculation: '+',
      text: "如果自己的备战宝可梦身上放置有伤害指示物的话，则追加造成120伤害。"
    },
  ];
  public regulationMark = "H";
  public set = "CSVH6pC";
  public setNumber = "004";
  public name = "Koraidon ex";
  public fullName = "Koraidon ex CSVH6pC";
  public cardImage = "assets/cardback.png";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this) && effect.player.bench.some(list => list.cards.length > 0 && list.damage > 0)) {
      effect.damage += 120;
    }
    return state;
  }
}

export class Happy6PaldeanClodsireEx extends PokemonCard {
  public stage = Stage.STAGE_1;
  public cardType = [CardType.DARK];
  public hp = 280;
  public weakness = [{ type: CardType.FIGHTING }];
  public resistance = [];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];
  public evolvesFrom = "Paldean Wooper";
  protected _tags = [CardTag.POKEMON_ex];
  public attacks = [
    {
      name: "毒液圆阵",
      cost: [CardType.DARK, CardType.COLORLESS],
      damage: 60,
      text: "令对手的战斗宝可梦陷入【中毒】状态。在下一个对手的回合，受到这个招式影响的宝可梦，无法撤退。"
    },
    {
      name: "终极冲击",
      cost: [CardType.DARK, CardType.DARK, CardType.COLORLESS],
      damage: 220,
      text: "在下一个自己的回合，这只宝可梦无法使用招式。"
    },
  ];
  public regulationMark = "H";
  public set = "CSVH6pC";
  public setNumber = "005";
  public name = "Paldean Clodsire ex";
  public fullName = "Paldean Clodsire ex CSVH6pC";
  public cardImage = "assets/cardback.png";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      effect.afterDamageEffects.push(state => {
        state = store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.POISONED]));
        return BLOCK_RETREAT(store, state, effect, this);
      });
    }
    if (WAS_ATTACK_USED(effect, 1, this)) THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN(effect.player);
    return state;
  }
}
