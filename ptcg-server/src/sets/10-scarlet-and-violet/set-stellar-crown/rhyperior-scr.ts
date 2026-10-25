import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Rhyperior extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Rhydon';
  public cardType: CardType[] = [F];
  public hp: number = 200;
  public weakness = [{ type: G }];
  public retreat = [C, C, C, C];

  public powers = [{
    name: 'Wide Wall',
    powerType: PowerType.ABILITY,
    text: 'As long as this Pokémon is in the Active Spot, whenever your opponent plays a Supporter card from their hand, prevent all effects of that card done to all of your Pokémon.'
  }];

  public attacks = [{
    name: 'Drill Run',
    cost: [F, C, C],
    damage: 180,
    text: 'Discard an Energy from your opponent\'s Active Pokémon.'
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '76';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Rhyperior';
  public fullName: string = 'Rhyperior SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON(store, state, effect);
    }
    return state;
  }
}
