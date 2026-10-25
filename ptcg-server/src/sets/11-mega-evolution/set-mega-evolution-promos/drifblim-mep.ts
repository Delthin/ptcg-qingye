import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AFTER_ATTACK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import {
  PUT_THIS_POKEMON_AND_ALL_ATTACHED_CARDS_INTO_YOUR_HAND,
  YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED,
} from '../../../game/store/prefabs/attack-effects';

export class Drifblim extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Drifloon';
  public cardType: CardType[] = [P];
  public hp: number = 110;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Disruptive Wind',
      cost: [P],
      damage: 0,
      text: 'Your opponent\'s Active Pokémon is now Confused.',
    },
    {
      name: 'Balloon Return',
      cost: [P, P],
      damage: 110,
      text: 'Put this Pokémon and all attached cards into your hand.',
    },
  ];

  public regulationMark = 'I';
  public set: string = 'MEP';
  public setNumber: string = '6';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Drifblim';
  public fullName: string = 'Drifblim MEP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
    }

    if (AFTER_ATTACK(effect, 1, this)) {
      PUT_THIS_POKEMON_AND_ALL_ATTACHED_CARDS_INTO_YOUR_HAND(store, state, effect);
    }

    return state;
  }
}
