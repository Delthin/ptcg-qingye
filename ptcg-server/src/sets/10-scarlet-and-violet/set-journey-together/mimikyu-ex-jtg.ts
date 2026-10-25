import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardTag, CardType, Stage } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  THIS_ATTACK_DOES_X_DAMAGE_TO_X_OF_YOUR_OPPONENTS_POKEMON,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED } from '../../../game/store/prefabs/attack-effects';

export class Mimikyuex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 190;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Mischievous Hands',
      cost: [P, C],
      damage: 0,
      text: 'Choose 2 of your opponent\'s Pokémon and put 3 damage counters on each of them.'
    },
    {
      name: 'Ghostly Trip',
      cost: [P, P, C],
      damage: 120,
      text: 'Your opponent\'s Active Pokémon is now Confused.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '69';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mimikyu ex';
  public fullName: string = 'Mimikyu ex JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Mischievous Hands: choose 2 of your opponent's Pokemon; 3 damage counters (30 damage,
    // no Weakness/Resistance) on each.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      THIS_ATTACK_DOES_X_DAMAGE_TO_X_OF_YOUR_OPPONENTS_POKEMON(30, effect, store, state, 2, 2);
    }

    // Ghostly Trip: opponent's Active Pokemon is now Confused.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
    }

    return state;
  }
}
