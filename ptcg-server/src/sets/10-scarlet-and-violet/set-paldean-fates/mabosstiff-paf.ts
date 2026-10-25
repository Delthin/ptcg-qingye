import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ABILITY_USED,
  IS_ABILITY_BLOCKED,
  SWITCH_OUT_OPPONENT_ACTIVE_POKEMON,
  THIS_POKEMON_DOES_DAMAGE_TO_ITSELF,
  WAS_ATTACK_USED,
  WAS_POWER_USED,
} from '../../../game/store/prefabs/prefabs';

export class Mabosstiff extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Maschiff';
  public cardType: CardType[] = [D];
  public hp: number = 130;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public powers = [{
    name: 'Intimidating Howl',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, you may switch out your opponent\'s Active Pokémon to the Bench. (Your opponent chooses the new Active Pokémon.)'
  }];

  public attacks = [{
    name: 'Wild Tackle',
    cost: [D, D, C],
    damage: 160,
    text: 'This Pokémon also does 30 damage to itself.'
  }];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '188';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mabosstiff';
  public fullName: string = 'Mabosstiff PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      ABILITY_USED(player, this);
      return SWITCH_OUT_OPPONENT_ACTIVE_POKEMON(store, state, player);
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 30);
    }

    return state;
  }
}
