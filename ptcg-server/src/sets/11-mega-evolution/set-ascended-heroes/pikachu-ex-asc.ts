import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardTag, CardType, Stage } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { CheckHpEffect } from '../../../game/store/effects/check-effects';
import { DAMAGED_FROM_FULL_HP, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class Pikachuex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 200;
  public weakness = [{ type: F }];
  public retreat = [C];

  protected _tags = [CardTag.POKEMON_ex];

  public powers = [{
    name: 'Resolute Heart',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon has full HP and would be Knocked Out by damage from an attack, it is not Knocked Out, and its remaining HP becomes 10.'
  }];

  public attacks = [{
    name: 'Topaz Bolt',
    cost: [G, L, M],
    damage: 300,
    text: 'Discard 3 Energy from this Pokémon.'
  }];

  public regulationMark = 'H';
  public set: string = 'ASC';
  public setNumber: string = '57';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pikachu ex';
  public fullName: string = 'Pikachu ex ASC';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 3, {}, 3);
    }

    if (effect instanceof PutDamageEffect && effect.target.cards.includes(this)) {
      const target = effect.target;

      // As long as this Pokémon is on your Bench, prevent all damage done to this
      // Pokémon by attacks (both yours and your opponent's).
      const isActive = state.players.some(player => player.active === target);
      if (!isActive) {
        effect.damage = 0;
        return state;
      }

      // Resolute Heart: if this Pokémon has full HP and would be Knocked Out by damage
      // from an attack, it is not Knocked Out and its remaining HP becomes 10.
      const owner = state.players.find(player => player.active === target || player.bench.includes(target));
      if (owner !== undefined && DAMAGED_FROM_FULL_HP(store, state, effect, owner, target)) {
        const checkHp = new CheckHpEffect(owner, target);
        state = store.reduceEffect(state, checkHp);
        effect.damage = Math.max(0, checkHp.hp - 10);
      }
    }

    return state;
  }
}
