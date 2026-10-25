import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { Player, PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AfterDamageEffect } from '../../../game/store/effects/attack-effects';
import { ADD_BURN_TO_PLAYER_ACTIVE, IS_ABILITY_BLOCKED, IS_ATTACK_EFFECT_FROM_OPPONENTS_POKEMON } from '../../../game/store/prefabs/prefabs';

export class Armarouge extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Charcadet';
  public cardType: CardType[] = [R];
  public hp: number = 120;
  public weakness = [{ type: W }];
  public retreat = [C];

  public powers = [{
    name: 'Scorching Armor',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon is in the Active Spot and is damaged by an attack from your opponent\'s Pokémon (even if this Pokémon is Knocked Out), the Attacking Pokémon is now Burned.'
  }];

  public attacks = [{
    name: 'Steam Artillery',
    cost: [R, C],
    damage: 70,
    text: ''
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '44';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Armarouge';
  public fullName: string = 'Armarouge OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AfterDamageEffect && effect.target.getPokemonCard() === this) {
      // The ability only applies while this Pokémon is in the Active Spot.
      const defender: Player | undefined = state.players.find(player => player.active.getPokemonCard() === this);

      if (defender === undefined) {
        return state;
      }

      if (IS_ABILITY_BLOCKED(store, state, defender, this)) {
        return state;
      }

      // Only damage from an attack of one of the opponent's Pokémon triggers it.
      if (!IS_ATTACK_EFFECT_FROM_OPPONENTS_POKEMON(state, effect)) {
        return state;
      }

      const attacker = StateUtils.getOpponent(state, defender);
      ADD_BURN_TO_PLAYER_ACTIVE(store, state, attacker, this);
    }
    return state;
  }
}
