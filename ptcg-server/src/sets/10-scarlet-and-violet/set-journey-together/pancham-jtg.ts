import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Pancham extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 60;
  public weakness = [{ type: P }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Corkscrew Punch',
      cost: [C],
      damage: 10,
      text: ''
    },
    {
      name: 'Focus Fist',
      cost: [C, C, C],
      damage: 50,
      text: 'Flip a coin. If tails, this attack does nothing.'
    }
  ];

  public regulationMark = 'I';
  public set: string = 'JTG';
  public setNumber: string = '83';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pancham';
  public fullName: string = 'Pancham JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = COIN_FLIP_PROMPT(store, state, effect.player, result => {
        if (!result) {
          effect.damage = 0;
        }
      });
    }

    return state;
  }
}
