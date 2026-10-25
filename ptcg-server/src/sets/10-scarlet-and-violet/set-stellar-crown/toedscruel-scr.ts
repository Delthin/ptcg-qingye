import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { HEAL_X_DAMAGE_FROM_THIS_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Toedscruel extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Toedscool';
  public cardType: CardType[] = [G];
  public hp: number = 140;
  public weakness = [{ type: R }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Mega Drain',
      cost: [G, C],
      damage: 30,
      text: 'Heal 30 damage from this Pokémon.'
    },
    {
      name: 'Whip Smash',
      cost: [G, C, C],
      damage: 90,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '18';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Toedscruel';
  public fullName: string = 'Toedscruel SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      HEAL_X_DAMAGE_FROM_THIS_POKEMON(30, effect, store, state);
    }
    return state;
  }
}
