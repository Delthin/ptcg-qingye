import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, DEAL_MORE_DAMAGE_IF_OPPONENT_ACTIVE_HAS_CARD_TAG } from '../../../game/store/prefabs/prefabs';
import { FLIP_COIN_TO_PREVENT_DAMAGE_DURING_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Golurk extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Golett';
  public cardType: CardType[] = [F];
  public hp: number = 160;
  public weakness = [{ type: G }];
  public retreat = [C, C, C, C];

  public attacks = [{
    name: 'Iron Defense',
    cost: [F],
    damage: 0,
    text: 'Flip a coin. If heads, during your opponent\'s next turn, prevent all damage done to this Pokémon by attacks.'
  },
  {
    name: 'Fighting Fist',
    cost: [C, C, C, C],
    damage: 120,
    damageCalculation: '+',
    text: 'If your opponent\'s Active Pokémon is a Pokémon ex or Pokémon V, this attack does 120 more damage.'
  }];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '88';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Golurk';
  public fullName: string = 'Golurk TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = FLIP_COIN_TO_PREVENT_DAMAGE_DURING_OPPONENTS_NEXT_TURN(store, state, effect, this);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      DEAL_MORE_DAMAGE_IF_OPPONENT_ACTIVE_HAS_CARD_TAG(effect, state, 120, CardTag.POKEMON_ex, CardTag.POKEMON_V);
    }

    return state;
  }
}
