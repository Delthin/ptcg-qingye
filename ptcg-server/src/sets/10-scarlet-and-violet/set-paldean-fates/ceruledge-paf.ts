import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  DEAL_MORE_DAMAGE_IF_OPPONENT_ACTIVE_HAS_CARD_TAG,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';
import { HEAL_X_DAMAGE_FROM_THIS_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Ceruledge extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Charcadet';
  public cardType: CardType[] = [P];
  public hp: number = 140;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Life Sucker',
      cost: [C, C],
      damage: 50,
      text: 'Heal 30 damage from this Pokémon.',
    },
    {
      name: 'Fighting Sword',
      cost: [P, C, C],
      damage: 100,
      damageCalculation: '+',
      text: 'If your opponent\'s Active Pokémon is a Pokémon ex or Pokémon V, this attack does 100 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '40';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Ceruledge';
  public fullName: string = 'Ceruledge PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      HEAL_X_DAMAGE_FROM_THIS_POKEMON(30, effect, store, state);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      DEAL_MORE_DAMAGE_IF_OPPONENT_ACTIVE_HAS_CARD_TAG(
        effect, state, 100, CardTag.POKEMON_ex, CardTag.POKEMON_V);
    }

    return state;
  }
}
