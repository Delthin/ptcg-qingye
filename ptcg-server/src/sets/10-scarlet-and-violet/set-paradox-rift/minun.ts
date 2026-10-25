import { putPokemonPowerDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Effect } from '../../../game/store/effects/effect';
import { AttachEnergyEffect } from '../../../game/store/effects/play-card-effects';
import { IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class Minun extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.LIGHTNING];
  public hp: number = 70;
  public weakness = [{ type: CardType.FIGHTING }];
  public resistance = [{ type: CardType.METAL, value: -20 }];
  public retreat = [CardType.COLORLESS];

  public powers = [{
    name: 'Buddy Pulse',
    powerType: PowerType.ABILITY,
    text: 'If you have Plusle in play, whenever your opponent attaches an Energy card from their hand to 1 of their Pokémon, put 2 damage counters on that Pokémon. The effect of Buddy Pulse doesn\'t stack.'
  }];

  public attacks = [{
    name: 'Speed Ball',
    cost: [CardType.LIGHTNING],
    damage: 20,
    text: '',
  }];

  public set: string = 'PAR';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '61';
  public name: string = 'Minun';
  public regulationMark: string = 'G';
  public fullName: string = 'Minun PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (effect instanceof AttachEnergyEffect) {
      const source = StateUtils.findPokemonSlot(state, this);
      if (!source || source.getPokemonCard() !== this) return state;
      const owner = StateUtils.findOwner(state, source);
      if (effect.player === owner || effect.source !== effect.player.hand) return state;
      if (IS_ABILITY_BLOCKED(store, state, owner, this)) return state;
      const ownPokemon = [owner.active, ...owner.bench].map(list => list.getPokemonCard()).filter(card => !!card);
      if (!ownPokemon.some(card => card!.name === 'Plusle')) return state;
      const firstMinun = ownPokemon.find(card => card!.name === this.name
        && !IS_ABILITY_BLOCKED(store, state, owner, card!));
      if (firstMinun !== this) return state;
      effect.onAttached.push(() => {
        state = putPokemonPowerDamageCounters(store, state, this, effect.target, 20);
      });
    }

    return state;
  }
}
