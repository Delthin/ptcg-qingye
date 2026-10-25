import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag, SpecialCondition } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AddSpecialConditionsEffect } from '../../../game/store/effects/attack-effects';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class TeamRocketsRattata extends PokemonCard {
  protected _tags = [CardTag.TEAM_ROCKET];
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 50;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [{
    name: 'Dangerous Incisors',
    cost: [C],
    damage: 10,
    text: 'Your opponent\'s Active Pokémon is now Poisoned.',
  }];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '147';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Team Rocket\'s Rattata';
  public fullName: string = 'Team Rocket\'s Rattata DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      effect.afterDamageEffects.push(state =>
        store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.POISONED])));
    }
    return state;
  }
}
