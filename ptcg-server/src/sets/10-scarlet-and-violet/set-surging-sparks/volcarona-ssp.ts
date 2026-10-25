import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HEAL_X_DAMAGE_FROM_THIS_POKEMON, THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Volcarona extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Larvesta';
  public cardType: CardType[] = [R];
  public hp: number = 140;
  public weakness = [{ type: W }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Leech Life',
      cost: [C],
      damage: 30,
      text: 'Heal from this Pokémon the same amount of damage you did to your opponent\'s Active Pokémon.',
    },
    {
      name: 'Turbulent Wings',
      cost: [R, C, C],
      damage: 150,
      text: 'This Pokémon also does 50 damage to itself.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '25';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Volcarona';
  public fullName: string = 'Volcarona SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      HEAL_X_DAMAGE_FROM_THIS_POKEMON(effect, store, state, 30);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 50);
    }

    return state;
  }
}
