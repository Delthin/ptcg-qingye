import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike } from '../../../game/store/store-like';
import { State } from '../../../game/store/state/state';
import { Effect } from '../../../game/store/effects/effect';
import {
  THIS_POKEMON_DOES_DAMAGE_TO_ITSELF,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Magnemite extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.LIGHTNING];
  public hp: number = 60;
  public weakness = [{ type: CardType.FIGHTING }];
  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Tiny Charge',
      cost: [CardType.LIGHTNING],
      damage: 10,
      text: '',
    },
    {
      name: 'Big Explosion',
      cost: [CardType.LIGHTNING, CardType.COLORLESS],
      damage: 60,
      text: 'This Pokémon also does 60 damage to itself.',
    },
  ];

  public set: string = 'MEW';
  public regulationMark: string = 'G';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '81';
  public name: string = 'Magnemite';
  public fullName: string = 'Magnemite MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 60);
    }
    return state;
  }
}
