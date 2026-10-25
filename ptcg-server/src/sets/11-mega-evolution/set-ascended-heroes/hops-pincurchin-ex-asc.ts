import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  DRAW_CARDS,
  ON_DAMAGED_BY_OPPONENT_ATTACK_EVEN_IF_KNOCKED_OUT,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class HopsPincurchinex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 200;
  public weakness = [{ type: F }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public powers = [{
    name: 'Counterattack Quills',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon is in the Active Spot and is damaged by an attack from your opponent\'s Pokémon (even if this Pokémon is Knocked Out), place 3 damage counters on the Attacking Pokémon.'
  }];

  public attacks = [{
    name: 'Spiky Thunder',
    cost: [L, L, C],
    damage: 120,
    text: 'Draw 2 cards.'
  }];

  public regulationMark = 'I';
  public set: string = 'ASC';
  public setNumber: string = '68';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Hop\'s Pincurchin ex';
  public fullName: string = 'Hop\'s Pincurchin ex ASC';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Spiky Thunder: 120 damage, then draw 2 cards.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DRAW_CARDS(store, state, effect.player, 2);
    }

    // Counterattack Quills: when this Pokémon is in the Active Spot and is damaged by an
    // attack from the opponent's Pokémon (even if Knocked Out), the helper places the
    // 3 damage counters on the Attacking Pokémon.
    if (ON_DAMAGED_BY_OPPONENT_ATTACK_EVEN_IF_KNOCKED_OUT(state, effect, {
      store,
      source: this,
      damageCounters: 3,
      damage: 30
    } as unknown as Parameters<typeof ON_DAMAGED_BY_OPPONENT_ATTACK_EVEN_IF_KNOCKED_OUT>[2])) {
      // Damage counters are applied by the helper.
    }

    return state;
  }
}
