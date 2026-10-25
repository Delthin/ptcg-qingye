import { deepClone } from '../../../utils/utils';
import { AttachEnergyEffect } from '../effects/play-card-effects';
import { State } from '../state/state';
import { Store } from '../store';
import { StoreLike } from '../store-like';
import { GameError } from '../../game-error';
import { GameMessage } from '../../game-message';

/** Resolve a non-manual batch using the real attachment lifecycle. Preflight
 * the entire batch on an isolated graph so a later illegal special Energy
 * cannot leave earlier attachments or passive markers committed.
 */
export function attachEnergyFromEffect(store: StoreLike, state: State, effects: AttachEnergyEffect[]): State {
  const trial = deepClone({ state, effects }) as { state: State, effects: AttachEnergyEffect[] };
  const validator = new Store({ onStateChange() {} }, false);
  for (const effect of trial.effects) {
    trial.state = validator.reduceEffect(trial.state, effect);
    if (!effect.preventDefault && (!effect.target.cards.includes(effect.energyCard) || effect.source.cards.includes(effect.energyCard))) {
      throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
    }
  }
  for (const effect of effects) state = store.reduceEffect(state, effect);
  return state;
}
