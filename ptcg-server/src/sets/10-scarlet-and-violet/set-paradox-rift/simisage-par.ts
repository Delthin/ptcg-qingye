import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { PREVENT_DAMAGE } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Simisage extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Pansage';
  public cardType: CardType[] = [G];
  public hp: number = 100;
  public weakness = [{ type: R }];
  public retreat = [C];

  public powers = [{
    name: 'Monkey Trio',
    powerType: PowerType.ABILITY,
    text: 'If you have Simisage, Simisear, and Simipour in play, ignore all Colorless Energy in the costs of attacks used by this Pokémon.'
  }];

  public attacks = [{
    name: 'Arm Thrust Needle',
    cost: [G, C, C],
    damage: 100,
    text: 'During your opponent\'s next turn, prevent all damage done to this Pokémon by attacks from Pokémon that have an Ability, except any Simisage.'
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '5';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Simisage';
  public fullName: string = 'Simisage PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = PREVENT_DAMAGE(store, state, effect, this);
    }
    return state;
  }
}
