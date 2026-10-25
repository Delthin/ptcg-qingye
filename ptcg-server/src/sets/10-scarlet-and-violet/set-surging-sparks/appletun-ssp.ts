import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, THIS_POKEMON_DOES_DAMAGE_TO_ITSELF } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_CANNOT_ATTACK } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Appletun extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Applin';
  public cardType: CardType[] = [N];
  public hp: number = 90;
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Melting Sweetness',
      cost: [C, C],
      damage: 50,
      text: 'During your opponent\'s next turn, the Defending Pokémon can\'t attack.',
    },
    {
      name: 'Wild Tackle',
      cost: [G, R],
      damage: 130,
      text: 'This Pokémon also does 20 damage to itself.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '140';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Appletun';
  public fullName: string = 'Appletun SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DEFENDING_POKEMON_CANNOT_ATTACK(store, state, effect, this);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 20);
    }

    return state;
  }
}
