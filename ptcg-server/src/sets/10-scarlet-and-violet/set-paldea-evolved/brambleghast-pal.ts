import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { HEAL_X_DAMAGE_FROM_THIS_POKEMON } from '../../../game/store/prefabs/attack-effects';
import { DEFENDING_POKEMON_ATTACKS_COST_MORE } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Brambleghast extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Bramblin';
  public cardType: CardType[] = [G];
  public hp: number = 100;
  public weakness = [{ type: R }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Absorb Life',
      cost: [G],
      damage: 30,
      text: 'Heal 30 damage from this Pokémon.',
    },
    {
      name: 'Dead Wood Detention',
      cost: [C, C, C],
      damage: 80,
      text: 'During your opponent\'s next turn, attacks that the Defending Pokémon uses cost [C][C] more.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '24';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Brambleghast';
  public fullName: string = 'Brambleghast PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      HEAL_X_DAMAGE_FROM_THIS_POKEMON(30, effect, store, state);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DEFENDING_POKEMON_ATTACKS_COST_MORE(store, state, effect, 2);
    }

    return state;
  }
}
