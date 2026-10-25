import { PlayerType, PokemonCard, PowerType, StateUtils } from '../../../game';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { Effect } from '../../../game/store/effects/effect';
import { PowerEffect } from '../../../game/store/effects/game-effects';
import { putAbilityDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { CheckPokemonPowersEffect } from '../../../game/store/effects/check-effects';
import { BetweenTurnsEffect } from '../../../game/store/effects/game-phase-effects';
import { GamePhase, State } from '../../../game/store/state/state';
import { StoreLike } from '../../../game/store/store-like';
import { IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class Froslass extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom: string = 'Snorunt';
  public cardType: CardType[] = [W];
  public weakness = [{ type: M }];
  public hp: number = 90;
  public retreat = [C];

  public powers = [{
    name: 'Freezing Shroud',
    powerType: PowerType.ABILITY,
    text: 'During Pokémon Checkup, put 1 damage counter on each Pokémon in play that has any Abilities (excluding any Froslass).'
  }];

  public attacks = [{
    name: 'Frost Smash',
    cost: [W, C],
    damage: 60,
    text: ''
  }];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '53';
  public name: string = 'Froslass';
  public fullName: string = 'Froslass TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (!(effect instanceof BetweenTurnsEffect) || state.phase !== GamePhase.BETWEEN_TURNS) return state;
    const source = StateUtils.findPokemonSlot(state, this);
    if (!source || source.getPokemonCard() !== this) return state;
    const owner = StateUtils.findOwner(state, source);
    // Checkup emits once for each player; each physical Froslass resolves on its owner's pass.
    if (owner !== effect.player || IS_ABILITY_BLOCKED(store, state, owner, this)) return state;
    const power = new PowerEffect(owner, this.powers[0], this);
    for (const targetOwner of state.players) {
      targetOwner.forEachPokemon(PlayerType.BOTTOM_PLAYER, (cardList, card) => {
        if (card.name === 'Froslass') return;
        const powers = new CheckPokemonPowersEffect(targetOwner, card);
        state = store.reduceEffect(state, powers);
        if (powers.powers.some(value => value.powerType === PowerType.ABILITY)) {
          state = putAbilityDamageCounters(store, state, power, cardList, 10);
        }
      });
    }
    return state;
  }
}
