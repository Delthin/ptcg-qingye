import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_FLIPS_COIN_TO_ATTACK } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Sandygast extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 90;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Sand Attack',
      cost: [P],
      damage: 10,
      text: 'During your opponent\'s next turn, if the Defending Pokémon tries to use an attack, your opponent flips a coin. If tails, that attack doesn\'t happen.'
    },
    {
      name: 'Spooky Shot',
      cost: [P, C, C],
      damage: 30,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '91';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Sandygast';
  public fullName: string = 'Sandygast TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DEFENDING_POKEMON_FLIPS_COIN_TO_ATTACK(store, state, effect, this);
    }
    return state;
  }
}
