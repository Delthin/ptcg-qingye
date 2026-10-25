import { CardType, Stage, SpecialCondition } from '../../../game/store/card/card-types';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { HealEffect } from '../../../game/store/effects/game-effects';
import { Effect } from '../../../game/store/effects/effect';

import { State } from '../../../game/store/state/state';
import { StoreLike } from '../../../game/store/store-like';
import { THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Cetoddle extends PokemonCard {

  public stage: Stage = Stage.BASIC;

  public regulationMark = 'G';

  public cardType: CardType[] = [W];

  public hp: number = 100;

  public weakness = [{ type: M }];

  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Rest',
      cost: [C],
      damage: 0,
      text: 'This Pokémon is now Asleep. Heal 60 damage from it.'
    },
    {
      name: 'Double-Edge',
      cost: [W, C],
      damage: 50,
      text: 'This Pokémon also does 10 damage to itself.'
    }
  ];

  public set: string = 'PAL';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '53';

  public name: string = 'Cetoddle';

  public fullName: string = 'Cetoddle PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      effect.source.addSpecialCondition(SpecialCondition.ASLEEP);
      state = store.reduceEffect(state, new HealEffect(effect.player, effect.source, 60));
    }
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 10);
    }
    return state;
  }
}
