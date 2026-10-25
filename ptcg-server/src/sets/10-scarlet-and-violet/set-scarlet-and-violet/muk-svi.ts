import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ADD_POISON_TO_PLAYER_ACTIVE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Muk extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Grimer';
  public cardType: CardType[] = [D];
  public hp: number = 140;
  public weakness = [{ type: F }];
  public retreat = [C, C, C, C];

  public powers = [{
    name: 'Poison Sacs',
    powerType: PowerType.ABILITY,
    text: 'Your opponent\'s Poisoned Pokémon don\'t recover from that Special Condition when they evolve or devolve.'
  }];

  public attacks = [{
    name: 'Toxic Strike',
    cost: [D, C, C, C],
    damage: 100,
    text: 'Your opponent\'s Active Pokémon is now Poisoned.'
  }];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '127';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Muk';
  public fullName: string = 'Muk SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Toxic Strike: your opponent's Active Pokémon is now Poisoned.
    // Poison Sacs keeps that Special Condition through evolution/devolution and is
    // declared as a passive Ability; there is no prefab hook for the recovery step.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      ADD_POISON_TO_PLAYER_ACTIVE(store, state, effect.opponent, this);
    }
    return state;
  }
}
