import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  WAS_ATTACK_USED,
  HEAL_X_DAMAGE_FROM_THIS_POKEMON,
  DEAL_MORE_DAMAGE_IF_OPPONENT_ACTIVE_HAS_CARD_TAG,
} from '../../../game/store/prefabs/prefabs';

export class Vaporeon extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Eevee';
  public cardType: CardType[] = [W];
  public hp: number = 130;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Spiral Drain',
      cost: [W],
      damage: 30,
      text: 'Heal 30 damage from this Pokémon.',
    },
    {
      name: 'Fighting Whirlpool',
      cost: [W, C, C],
      damage: 90,
      damageCalculation: '+',
      text: 'If your opponent\'s Active Pokémon is a Pokémon ex or Pokémon V, this attack does 90 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PRE';
  public setNumber: string = '22';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Vaporeon';
  public fullName: string = 'Vaporeon PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Spiral Drain: Heal 30 damage from this Pokémon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      HEAL_X_DAMAGE_FROM_THIS_POKEMON(effect, store, state, 30);
    }

    // Fighting Whirlpool: +90 if the opponent's Active is a Pokémon ex or Pokémon V.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      DEAL_MORE_DAMAGE_IF_OPPONENT_ACTIVE_HAS_CARD_TAG(
        effect,
        state,
        90,
        CardTag.POKEMON_ex,
        CardTag.POKEMON_V,
      );
    }

    return state;
  }
}
