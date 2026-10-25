import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckHpEffect } from '../../../game/store/effects/check-effects';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED } from '../../../game/store/prefabs/attack-effects';

export class Claydol extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Baltoy';
  public cardType: CardType[] = [P];
  public hp: number = 120;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Kaboom Doll',
      cost: [P],
      damage: 0,
      text: 'Put damage counters on your opponent\'s Active Pokémon until its remaining HP is 10. If you placed any damage counters in this way, this attack also does 120 damage to this Pokémon.',
    },
    {
      name: 'Mind Bend',
      cost: [P],
      damage: 30,
      text: 'Your opponent\'s Active Pokémon is now Confused.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '95';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Claydol';
  public fullName: string = 'Claydol OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      const target = opponent.active;

      if (target.getPokemonCard() !== undefined) {
        const checkHpEffect = new CheckHpEffect(opponent, target);
        state = store.reduceEffect(state, checkHpEffect);

        // Place damage counters until the Defending Pokémon is at 10 remaining HP.
        const remainingHp = checkHpEffect.hp - target.damage;
        const damageToPlace = Math.floor((remainingHp - 10) / 10) * 10;

        if (damageToPlace > 0) {
          const damageEffect = new PutDamageEffect(effect, damageToPlace);
          damageEffect.target = target;
          state = store.reduceEffect(state, damageEffect);

          THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 120);
        }
      }
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
    }

    return state;
  }
}
