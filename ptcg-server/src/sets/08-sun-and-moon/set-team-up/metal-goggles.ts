import { PlaceDamageCountersEffect } from '../../../game/store/effects/game-effects';
import { StoreLike } from '../../../game';
import { CardType, TrainerType } from '../../../game/store/card/card-types';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { PutCountersEffect, PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { CheckPokemonTypeEffect } from '../../../game/store/effects/check-effects';
import { Effect } from '../../../game/store/effects/effect';
import { IS_TOOL_BLOCKED } from '../../../game/store/prefabs/prefabs';

import { StateUtils } from '../../../game/store/state-utils';
import { State } from '../../../game/store/state/state';

export class MetalGoggles extends TrainerCard {

  public trainerType: TrainerType = TrainerType.TOOL;

  public set: string = 'TEU';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '148';

  public name: string = 'Metal Goggles';

  public fullName: string = 'Metal Goggles TEU';

  public text: string =
    'The [M] Pokémon this card is attached to takes 30 less damage from your opponent\'s attacks (after applying Weakness and Resistance), and your opponent\'s attacks and Abilities can\'t put damage counters on it.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (!(effect instanceof PutDamageEffect || effect instanceof PutCountersEffect || (effect instanceof PlaceDamageCountersEffect && effect.origin === 'ability')) || !effect.target.tools.includes(this)) return state;
    const owner = StateUtils.findOwner(state, effect.target);
    if (owner === effect.player || IS_TOOL_BLOCKED(store, state, owner, this)) return state;
    const type = new CheckPokemonTypeEffect(effect.target);
    store.reduceEffect(state, type);
    if (!type.cardTypes.includes(CardType.METAL)) return state;
    if (effect instanceof PutDamageEffect) effect.damageReductionAfterWeakness += 30;
    else effect.preventDefault = true;
    return state;
  }

}
