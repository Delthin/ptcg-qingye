import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Rapidash extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Ponyta';
  public cardType: CardType[] = [R];
  public hp: number = 110;
  public weakness = [{ type: W }];
  public retreat = [];

  public attacks = [
    {
      name: 'Combustion',
      cost: [C],
      damage: 20,
      text: '',
    },
    {
      name: 'Inferno Onrush',
      cost: [R, C],
      damage: 120,
      text: 'This Pokémon also does 30 damage to itself.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '27';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Rapidash';
  public fullName: string = 'Rapidash TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 30);
    }
    return state;
  }
}
