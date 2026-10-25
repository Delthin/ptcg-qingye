import { ToolKnockOutReceipt, captureToolKnockOut, reactToToolKnockOut } from '../../../game/store/prefabs/tool-counter-effects';
import { AfterDamageEffect } from '../../../game/store/effects/attack-effects';
import { PlaceDamageCountersEffect } from '../../../game/store/effects/game-effects';
import { PutDamagePrompt } from '../../../game';
import { GameMessage } from '../../../game/game-message';
import { PlayerType, SlotType } from '../../../game/store/actions/play-card-action';
import { TrainerType } from '../../../game/store/card/card-types';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { Effect } from '../../../game/store/effects/effect';
import { KnockOutEffect } from '../../../game/store/effects/game-effects';

import { StateUtils } from '../../../game/store/state-utils';
import { State } from '../../../game/store/state/state';
import { StoreLike } from '../../../game/store/store-like';

export class SpellTag extends TrainerCard {

  public trainerType: TrainerType = TrainerType.TOOL;

  public set: string = 'LOT';

  public name: string = 'Spell Tag';

  public fullName: string = 'Spell Tag LOT';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '190';

  public text: string =
    'When the [P] Pokémon this card is attached to is Knocked Out by damage from an opponent\'s attack, put 4 damage counters on your opponent\'s Pokémon in any way you like.';

  public damageDealt = false;

  private counterReceipt?: ToolKnockOutReceipt;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AfterDamageEffect && effect.target.tools.includes(this)) {
      this.counterReceipt = captureToolKnockOut(store, state, effect, 'psychic');
    }
    if (effect instanceof KnockOutEffect && effect.target.tools.includes(this)) {
      const receipt = this.counterReceipt;
      this.counterReceipt = undefined;
      return reactToToolKnockOut(store, state, effect, this, receipt, (next, owner, _attacker) => {
      return store.prompt(next, new PutDamagePrompt(owner.id, GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
        PlayerType.TOP_PLAYER, [SlotType.ACTIVE, SlotType.BENCH], 40, [], { allowCancel: false }), results => {
        for (const result of results || []) {
          const target = StateUtils.getTarget(next, owner, result.target);
          const counters = new PlaceDamageCountersEffect(owner, target, result.damage);
          counters.origin = 'trainer'; counters.effectName = this.name;
          next = store.reduceEffect(next, counters);
        }
      });
      });
    }
    return state;
  }

}
