import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { HEAL_X_DAMAGE_FROM_THIS_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Sprigatitoex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 200;
  public weakness = [{ type: R }];
  public retreat = [C];

  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Scratch',
      cost: [C],
      damage: 20,
      text: '',
    },
    {
      name: 'Magical Leaf',
      cost: [G, C, C],
      damage: 100,
      text: 'Heal 30 damage from this Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '87';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Sprigatito ex';
  public fullName: string = 'Sprigatito ex SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      HEAL_X_DAMAGE_FROM_THIS_POKEMON(30, effect, store, state);
    }

    return state;
  }
}
