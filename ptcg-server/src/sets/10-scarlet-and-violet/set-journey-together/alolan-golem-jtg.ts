import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_A_COIN_UNTIL_YOU_GET_TAILS_DO_X_DAMAGE_PER_HEADS } from '../../../game/store/prefabs/attack-effects';

export class AlolanGolem extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Alolan Graveler';
  public cardType: CardType[] = [L];
  public hp: number = 180;
  public weakness = [{ type: F }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Electromagnetic Catapult',
      cost: [L],
      damage: 70,
      damageCalculation: 'x',
      text: 'Flip a coin until you get tails. This attack does 70 damage for each heads.',
    },
    {
      name: 'Megaton Fall',
      cost: [L, C],
      damage: 160,
      text: 'This Pokémon also does 40 damage to itself.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '46';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Alolan Golem';
  public fullName: string = 'Alolan Golem JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = FLIP_A_COIN_UNTIL_YOU_GET_TAILS_DO_X_DAMAGE_PER_HEADS(store, state, effect, 70);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 40);
    }

    return state;
  }
}
