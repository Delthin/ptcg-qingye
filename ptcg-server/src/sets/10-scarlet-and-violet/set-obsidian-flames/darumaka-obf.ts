import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Darumaka extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 80;
  public weakness = [{ type: W }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Headbutt',
      cost: [C, C],
      damage: 20,
      text: '',
    },
    {
      name: 'Surprise Attack',
      cost: [R, C, C],
      damage: 70,
      text: 'Flip a coin. If tails, this attack does nothing.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '34';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Darumaka';
  public fullName: string = 'Darumaka OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const attackEffect = effect;
      state = COIN_FLIP_PROMPT(store, state, attackEffect.player, result => {
        if (!result) {
          attackEffect.damage = 0;
        }
      });
    }
    return state;
  }
}
