import { CardTag, CardType, Stage } from '../../../game/store/card/card-types';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { PowerType } from '../../../game/store/card/pokemon-types';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { Effect } from '../../../game/store/effects/effect';
import { putPokemonPowerDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { ON_DAMAGED_BY_OPPONENT_ATTACK_EVEN_IF_KNOCKED_OUT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';
import { StateUtils } from '../../../game/store/state-utils';
import { State } from '../../../game/store/state/state';
import { StoreLike } from '../../../game/store/store-like';

export class Orthwormex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  protected _tags = [CardTag.POKEMON_ex];
  public cardType: CardType[] = [M];
  public hp: number = 220;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C, C, C];

  public powers = [
    {
      name: 'Pummeling Payback',
      powerType: PowerType.ABILITY,
      text: "If this Pokémon is damaged by an attack from your opponent's Pokémon(even if this Pokémon is Knocked Out), put 2 damage counters on the Attacking Pokémon for each [M] Energy attached to this Pokémon.",
    },
  ];

  public attacks = [
    {
      name: 'Rock Tomb',
      cost: [C, C, C, C],
      damage: 150,
      text: "During your opponent's next turn, the Defending Pokémon can't retreat.",
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '110';
  public name: string = 'Orthworm ex';
  public fullName: string = 'Orthworm ex SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Pummeling Payback
    if (ON_DAMAGED_BY_OPPONENT_ATTACK_EVEN_IF_KNOCKED_OUT(state, effect, { source: this, requireActiveSpot: false })) {
      const owner = StateUtils.findOwner(state, effect.target);
      const energy = new CheckProvidedEnergyEffect(owner, effect.target);
      store.reduceEffect(state, energy);
      const metal = energy.energyMap.reduce((total, entry) => total
        + entry.provides.filter(type => type === CardType.METAL || type === CardType.ANY).length, 0);
      return putPokemonPowerDamageCounters(store, state, this, effect.source, metal * 20);
    }

    // Rock Tomb
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return BLOCK_RETREAT(store, state, effect, this);
    }

    return state;
  }
}
