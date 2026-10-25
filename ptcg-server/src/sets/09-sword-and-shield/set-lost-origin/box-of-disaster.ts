import { ToolKnockOutReceipt, captureToolKnockOut, reactToToolKnockOut } from '../../../game/store/prefabs/tool-counter-effects';
import { AfterDamageEffect } from '../../../game/store/effects/attack-effects';
import { KnockOutEffect, PlaceDamageCountersEffect } from '../../../game/store/effects/game-effects';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType } from '../../../game/store/card/card-types';
import { StoreLike } from '../../../game/store/store-like';
import { State } from '../../../game/store/state/state';
import { Effect } from '../../../game/store/effects/effect';

export class BoxOfDisaster extends TrainerCard {
  public regulationMark = 'F';

  public trainerType: TrainerType = TrainerType.TOOL;

  public set: string = 'LOR';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '154';

  public name = 'Box of Disaster';

  public fullName = 'Box of Disaster LOR';

  public damageDealt: boolean = false;

  public text: string =
    "If the Pokémon V this card is attached to has full HP and is Knocked Out by damage from an attack from your opponent's Pokémon, put 8 damage counters on the Attacking Pokémon.";

  private counterReceipt?: ToolKnockOutReceipt;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AfterDamageEffect && effect.target.tools.includes(this)) {
      this.counterReceipt = captureToolKnockOut(store, state, effect, 'full-hp-v');
    }
    if (effect instanceof KnockOutEffect && effect.target.tools.includes(this)) {
      const receipt = this.counterReceipt;
      this.counterReceipt = undefined;
      return reactToToolKnockOut(store, state, effect, this, receipt, (next, owner, attacker) => {
      if (!attacker) return next;
      const counters = new PlaceDamageCountersEffect(owner, attacker, 80);
      counters.origin = 'trainer'; counters.effectName = this.name;
      return store.reduceEffect(next, counters);
      });
    }
    return state;
  }
}
