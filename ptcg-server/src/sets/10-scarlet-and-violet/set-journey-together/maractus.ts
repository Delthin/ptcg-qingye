import { CardType, PokemonCard, PowerType, Stage, State, StateUtils, StoreLike } from '../../../game';
import { CheckHpEffect } from '../../../game/store/effects/check-effects';
import { Effect } from '../../../game/store/effects/effect';
import { putPokemonPowerDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { ON_DAMAGED_BY_OPPONENT_ATTACK_EVEN_IF_KNOCKED_OUT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Maractus extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 110;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public powers = [{
    name: 'Explosive Needle',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon is in the Active Spot and is Knocked Out by damage from an attack from your opponent\'s Pokémon, put 6 damage counters on the Attacking Pokémon.'
  }];

  public attacks = [{
    name: 'Corner',
    cost: [C],
    damage: 20,
    text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.'
  }];

  public set: string = 'JTG';
  public regulationMark: string = 'I';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '8';
  public name: string = 'Maractus';
  public fullName: string = 'Maractus JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Explosive Needle
    if (ON_DAMAGED_BY_OPPONENT_ATTACK_EVEN_IF_KNOCKED_OUT(state, effect, { source: this })) {
      const owner = StateUtils.findOwner(state, effect.target);
      const hp = new CheckHpEffect(owner, effect.target);
      store.reduceEffect(state, hp);
      if (effect.target.damage >= hp.hp) {
        state = putPokemonPowerDamageCounters(store, state, this, effect.source, 60);
      }
    }
    // Corner
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return BLOCK_RETREAT(store, state, effect, this);
    }
    return state;
  }

}