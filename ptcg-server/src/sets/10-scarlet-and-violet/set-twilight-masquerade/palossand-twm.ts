import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_FLIPS_COIN_TO_ATTACK } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Palossand extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Sandygast';
  public cardType: CardType[] = [P];
  public hp: number = 150;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Sand Attack',
      cost: [P, C, C],
      damage: 60,
      text: 'During your opponent\'s next turn, if the Defending Pokémon tries to use an attack, your opponent flips a coin. If tails, that attack doesn\'t happen.',
    },
    {
      name: 'Spooky Sand',
      cost: [P, C, C, C],
      damage: 150,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '92';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Palossand';
  public fullName: string = 'Palossand TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DEFENDING_POKEMON_FLIPS_COIN_TO_ATTACK(store, state, effect, this);
    }
    return state;
  }
}
