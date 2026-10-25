import { PokemonCard, Stage, CardTag, CardType, StoreLike, State, CoinFlipPrompt, GameMessage } from '../../game';
import { Effect } from '../../game/store/effects/effect';
import { AttackEffect, HealEffect } from '../../game/store/effects/game-effects';
import { WAS_ATTACK_USED, DISCARD_ALL_ENERGY_FROM_POKEMON } from '../../game/store/prefabs/prefabs';

/** CSVH1C 008/059. This is NOT the 200 HP Terastal Pikachu ex. */
export class PikachuChineseStarter extends PokemonCard {
  public stage = Stage.BASIC;
  protected _tags = [CardTag.POKEMON_ex];
  public cardType = [CardType.LIGHTNING];
  public hp = 190;
  public weakness = [{ type: CardType.FIGHTING }];
  public retreat = [];
  public attacks = [
    { name: 'Pika Punch', cost: [CardType.COLORLESS], damage: 30, text: '' },
    { name: 'Strong Volt', cost: [CardType.LIGHTNING, CardType.LIGHTNING, CardType.COLORLESS], damage: 220,
      text: 'Flip a coin. If tails, discard all Energy from this Pokémon.' },
  ];
  public regulationMark = 'G';
  public set = 'CSVH1C';
  public setNumber = '008';
  public cardImage = 'assets/cardback.png';
  public name = 'Pikachu ex';
  public fullName = 'Pikachu ex CSVH1C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const attack = effect as AttackEffect;
      return store.prompt(state, new CoinFlipPrompt(attack.player.id, GameMessage.COIN_FLIP), result => {
        if (!result) DISCARD_ALL_ENERGY_FROM_POKEMON(store, state, attack, this);
      });
    }
    return state;
  }
}

/** CSVH1C 001/059. */
export class ShroomishChineseStarter extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.GRASS];
  public hp = 60;
  public weakness = [{ type: CardType.FIRE }];
  public retreat = [CardType.COLORLESS];
  public attacks = [{ name: 'Absorb', cost: [CardType.GRASS], damage: 10, text: 'Heal 10 damage from this Pokémon.' }];
  public regulationMark = 'G';
  public set = 'CSVH1C';
  public setNumber = '001';
  public cardImage = 'assets/cardback.png';
  public name = 'Shroomish';
  public fullName = 'Shroomish CSVH1C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return store.reduceEffect(state, new HealEffect(effect.player, effect.player.active, 10));
    }
    return state;
  }
}

/** CSVH1C 002/059: a vanilla 60 damage attack, not a different Breloom printing. */
export class BreloomChineseStarter extends PokemonCard {
  public stage = Stage.STAGE_1;
  public evolvesFrom = 'Shroomish';
  public cardType = [CardType.GRASS];
  public hp = 110;
  public weakness = [{ type: CardType.FIRE }];
  public retreat = [CardType.COLORLESS];
  public attacks = [{ name: 'Mach Straight', cost: [CardType.GRASS], damage: 60, text: '' }];
  public regulationMark = 'G';
  public set = 'CSVH1C';
  public setNumber = '002';
  public cardImage = 'assets/cardback.png';
  public name = 'Breloom';
  public fullName = 'Breloom CSVH1C';
}

export const setChineseStarters = [new PikachuChineseStarter(), new ShroomishChineseStarter(), new BreloomChineseStarter()];
