import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class Reshiramex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 220;
  public weakness = [{ type: W }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Fire Wing',
      cost: [R],
      damage: 40,
      text: '',
    },
    {
      name: 'Scorching Fire',
      cost: [R, R, C],
      damage: 200,
      text: 'Discard an Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '30';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Reshiram ex';
  public fullName: string = 'Reshiram ex JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 1, {}, 1);
    }
    return state;
  }
}
