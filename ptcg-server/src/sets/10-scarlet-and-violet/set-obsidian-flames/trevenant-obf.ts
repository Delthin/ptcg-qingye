import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { BetweenTurnsEffect } from '../../../game/store/effects/game-phase-effects';
import { AttackEffect } from '../../../game/store/effects/game-effects';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';
import { IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Trevenant extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Phantump';
  public cardType: CardType[] = [G];
  public hp: number = 140;
  public weakness = [{ type: R }];
  public retreat = [C, C, C];

  public powers = [{
    name: 'Forest Miasma',
    powerType: PowerType.ABILITY,
    text: 'During Pokémon Checkup, if this Pokémon is in the Active Spot, put 1 damage counter on your opponent\'s Active Pokémon.',
  }];

  public attacks = [{
    name: 'Lock Up',
    cost: [C, C, C],
    damage: 100,
    text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.',
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '12';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Trevenant';
  public fullName: string = 'Trevenant OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Forest Miasma: during Pokémon Checkup, if this Pokémon is in the Active Spot,
    // put 1 damage counter on your opponent's Active Pokémon.
    if (effect instanceof BetweenTurnsEffect) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      if (player.active.getPokemonCard() !== this) {
        return state;
      }

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      if (opponent.active.cards.length === 0) {
        return state;
      }

      const damageEffect = new PutDamageEffect(effect as unknown as AttackEffect, 10);
      damageEffect.target = opponent.active;
      store.reduceEffect(state, damageEffect);
      return state;
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = BLOCK_RETREAT(store, state, effect, this);
    }

    return state;
  }
}
