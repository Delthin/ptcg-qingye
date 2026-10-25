import { putPokemonPowerDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State, StateUtils, PowerType } from '../../../game';
import { AttackEffect } from '../../../game/store/effects/game-effects';
import { AttachEnergyEffect } from '../../../game/store/effects/play-card-effects';
import { IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class Arctozolt extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Rare Fossil';
  public cardType: CardType[] = [L];
  public hp: number = 130;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public powers = [{
    name: 'Biting Whirlpool',
    powerType: PowerType.ABILITY,
    text: 'Whenever your opponent attaches an Energy card from their hand to 1 of their Pokémon, put 2 damage counters on that Pokémon.'
  }];

  public attacks = [{
    name: 'Electro Ball',
    cost: [L, C],
    damage: 70,
    text: ''
  }];

  public set: string = 'DAA';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '66';
  public name: string = 'Arctozolt';
  public fullName: string = 'Arctozolt DAA';

  public reduceEffect(store: StoreLike, state: State, effect: AttackEffect): State {

    if (effect instanceof AttachEnergyEffect) {
      const source = StateUtils.findPokemonSlot(state, this);
      if (!source || source.getPokemonCard() !== this) return state;
      const owner = StateUtils.findOwner(state, source);
      if (effect.player === owner || effect.source !== effect.player.hand) return state;
      if (IS_ABILITY_BLOCKED(store, state, owner, this)) return state;
      effect.onAttached.push(() => {
        state = putPokemonPowerDamageCounters(store, state, this, effect.target, 20);
      });
    }
    return state;
  }
}