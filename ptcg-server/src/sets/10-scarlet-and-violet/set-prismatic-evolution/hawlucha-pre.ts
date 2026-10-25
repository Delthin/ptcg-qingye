import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, DEAL_MORE_DAMAGE_IF_OPPONENT_ACTIVE_HAS_CARD_TAG } from '../../../game/store/prefabs/prefabs';

export class Hawlucha extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 80;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [{
    name: 'Rising Tackle',
    cost: [C],
    damage: 10,
    damageCalculation: '+',
    text: 'If your opponent\'s Active Pokémon is a Pokémon ex, this attack does 50 more damage.'
  }];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '89';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Hawlucha';
  public fullName: string = 'Hawlucha PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      DEAL_MORE_DAMAGE_IF_OPPONENT_ACTIVE_HAS_CARD_TAG(effect, state, 50, CardTag.POKEMON_ex);
    }
    return state;
  }
}
