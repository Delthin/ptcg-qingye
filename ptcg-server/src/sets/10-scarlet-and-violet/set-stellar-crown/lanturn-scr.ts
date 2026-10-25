import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  WAS_ATTACK_USED,
  ADD_CONFUSION_TO_PLAYER_ACTIVE,
  THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN,
} from '../../../game/store/prefabs/prefabs';

export class Lanturn extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Chinchou';
  public cardType: CardType[] = [L];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Disorienting Flash',
      cost: [C, C],
      damage: 0,
      text: 'Your opponent\'s Active Pokémon is now Confused. Put 8 damage counters instead of 3 on that Pokémon for this Special Condition.'
    },
    {
      name: 'Thunderous Bolt',
      cost: [L, C, C],
      damage: 140,
      text: 'During your next turn, this Pokémon can\'t attack.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '49';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lanturn';
  public fullName: string = 'Lanturn SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      ADD_CONFUSION_TO_PLAYER_ACTIVE(store, state, effect.opponent, this, 80);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN(effect.player);
    }

    return state;
  }
}
