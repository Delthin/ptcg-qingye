import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HEAL_X_DAMAGE_FROM_THIS_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Carnivine extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 110;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Nosh',
      cost: [C],
      damage: 0,
      text: 'Heal 40 damage from this Pokémon.'
    },
    {
      name: 'Loom Over',
      cost: [G, C, C],
      damage: 130,
      damageCalculation: '-',
      text: 'This attack does 10 less damage for each damage counter on this Pokémon.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '7';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Carnivine';
  public fullName: string = 'Carnivine SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Nosh: Heal 40 damage from this Pokémon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = HEAL_X_DAMAGE_FROM_THIS_POKEMON(effect, store, state, 40);
    }

    // Loom Over: This attack does 10 less damage for each damage counter on this Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const damageCounters = Math.floor(player.active.damage / 10);
      effect.damage = Math.max(0, effect.damage - damageCounters * 10);
    }

    return state;
  }
}
