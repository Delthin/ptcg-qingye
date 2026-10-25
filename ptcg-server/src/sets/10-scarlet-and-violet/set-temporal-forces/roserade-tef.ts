import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AfterDamageEffect } from '../../../game/store/effects/attack-effects';
import { ADD_POISON_TO_PLAYER_ACTIVE, IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Roserade extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Roselia';
  public cardType: CardType[] = [G];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public powers = [{
    name: 'Poison Point',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon is in the Active Spot and is damaged by an attack from your opponent\'s Pokémon (even if this Pokémon is Knocked Out), the Attacking Pokémon is now Poisoned.',
  }];

  public attacks = [{
    name: 'Bind Down',
    cost: [C, C],
    damage: 70,
    text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.',
  }];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '9';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Roserade';
  public fullName: string = 'Roserade TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Poison Point
    if (effect instanceof AfterDamageEffect && effect.target.getPokemonCard() === this) {
      const player = state.players.find(p => p.active.getPokemonCard() === this);

      // Only triggers while this Pokémon is in the Active Spot and the Ability is not blocked.
      if (player !== undefined && !IS_ABILITY_BLOCKED(store, state, player, this)) {
        const opponent = StateUtils.getOpponent(state, player);

        if (opponent.active.cards.length > 0) {
          ADD_POISON_TO_PLAYER_ACTIVE(store, state, opponent, this);
        }
      }
    }

    // Bind Down
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = BLOCK_RETREAT(store, state, effect, this);
    }

    return state;
  }
}
