import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  DEAL_MORE_DAMAGE_IF_OPPONENT_ACTIVE_HAS_CARD_TAG,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Koraidon extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 130;
  public weakness = [{ type: P }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Resolute Fang',
    cost: [F, F],
    damage: 50,
    damageCalculation: '+',
    text: 'If your opponent\'s Active Pokémon is a Pokémon ex, this attack does 70 more damage.',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '90';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Koraidon';
  public fullName: string = 'Koraidon SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      DEAL_MORE_DAMAGE_IF_OPPONENT_ACTIVE_HAS_CARD_TAG(effect, state, 70, CardTag.POKEMON_ex);
    }
    return state;
  }
}
