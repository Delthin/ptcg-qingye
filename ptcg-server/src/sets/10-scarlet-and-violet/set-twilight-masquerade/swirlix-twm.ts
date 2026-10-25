import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_POKEMON } from '../../../game/store/prefabs/attack-effects';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Swirlix extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 50;
  public weakness = [{ type: M }];
  public retreat = [C];

  public powers = [{
    name: 'Festival Lead',
    powerType: PowerType.ABILITY,
    text: 'If Festival Grounds is in play, this Pokémon may use an attack it has twice. If the first attack Knocks Out your opponent\'s Active Pokémon, you may attack again after your opponent chooses a new Active Pokémon.',
  }];

  public attacks = [{
    name: 'Sneaky Placement',
    cost: [P],
    damage: 0,
    text: 'Put 2 damage counters on 1 of your opponent\'s Pokémon.',
  }];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '89';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Swirlix';
  public fullName: string = 'Swirlix TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      // 2 damage counters on 1 of your opponent's Pokémon = 20 damage, no Weakness/Resistance.
      THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_POKEMON(20, effect, store, state);
    }
    return state;
  }
}
