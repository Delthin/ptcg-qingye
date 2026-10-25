import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AttackEffect } from '../../../game/store/effects/game-effects';
import { CheckHpEffect } from '../../../game/store/effects/check-effects';
import { IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { THIS_POKEMON_TAKES_LESS_DAMAGE_FROM_ATTACKS_DURING_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Scizorex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Scyther';
  public cardType: CardType[] = [M];
  public hp: number = 120;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C];
  protected _tags = [CardTag.POKEMON_ex];

  public powers = [{
    name: 'Danger Perception',
    powerType: PowerType.ABILITY,
    text: 'As long as Scizor ex\'s remaining HP is 60 or less, Scizor ex does 40 more damage to the Defending Pokémon (before applying Weakness and Resistance).'
  }];

  public attacks = [
    {
      name: 'Steel Wing',
      cost: [M, C],
      damage: 40,
      text: 'During your opponent\'s next turn, any damage done to Scizor ex by attacks is reduced by 20 (after applying Weakness and Resistance).'
    },
    {
      name: 'Cross-Cut',
      cost: [C, C, C],
      damage: 50,
      damageCalculation: '+' as const,
      text: 'If the Defending Pokémon is an Evolved Pokémon, this attack does 50 damage plus 30 more damage.'
    }
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '108';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Scizor ex';
  public fullName: string = 'Scizor ex 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Danger Perception: while remaining HP is 60 or less, attacks from this Pokémon
    // deal 40 more damage (before Weakness and Resistance).
    if (effect instanceof AttackEffect && effect.source.getPokemonCard() === this) {
      const player = effect.player;
      const cardList = player.active;

      if (cardList.getPokemonCard() === this && !IS_ABILITY_BLOCKED(store, state, player, this)) {
        const checkHp = new CheckHpEffect(player, cardList);
        state = store.reduceEffect(state, checkHp);

        if (checkHp.hp - cardList.damage <= 60) {
          effect.damage += 40;
        }
      }
    }

    // Steel Wing
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = THIS_POKEMON_TAKES_LESS_DAMAGE_FROM_ATTACKS_DURING_OPPONENTS_NEXT_TURN(store, state, effect, 20);
    }

    // Cross-Cut
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const defending = effect.opponent.active.getPokemonCard();

      if (defending !== undefined && defending.stage !== Stage.BASIC) {
        effect.damage += 30;
      }
    }

    return state;
  }
}
