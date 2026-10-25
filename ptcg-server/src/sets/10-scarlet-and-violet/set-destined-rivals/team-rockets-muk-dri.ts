import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SpecialCondition } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED } from '../../../game/store/prefabs/attack-effects';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class TeamRocketsMuk extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = "Team Rocket's Grimer";
  public cardType: CardType[] = [D];
  public hp: number = 150;
  public weakness = [{ type: F }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Gooped Up',
      cost: [D, C],
      damage: 40,
      text: 'Your opponent\'s Active Pokémon is now Confused. During your opponent\'s next turn, that Pokémon can\'t retreat.',
    },
    {
      name: 'Hazardous Venom',
      cost: [D, D, C],
      damage: 100,
      damageCalculation: 'x',
      text: 'This attack does 100 damage for each Special Condition affecting your opponent\'s Active Pokémon.',
    },
  ];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '124';
  public cardImage: string = 'assets/cardback.png';
  public name: string = "Team Rocket's Muk";
  public fullName: string = "Team Rocket's Muk DRI";

  private readonly SPECIAL_CONDITION_LIST: SpecialCondition[] = [
    SpecialCondition.ASLEEP,
    SpecialCondition.BURNED,
    SpecialCondition.CONFUSED,
    SpecialCondition.PARALYZED,
    SpecialCondition.POISONED,
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Gooped Up: confuse the Defending Pokemon; it can't retreat during the opponent's next turn.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
      state = BLOCK_RETREAT(store, state, effect, this);
    }

    // Hazardous Venom: 100 damage for each Special Condition on the opponent's Active Pokemon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const opponent = effect.opponent;
      const conditionCount = opponent.active.specialConditions
        .filter(condition => this.SPECIAL_CONDITION_LIST.includes(condition)).length;

      effect.damage = 100 * conditionCount;
    }

    return state;
  }
}
