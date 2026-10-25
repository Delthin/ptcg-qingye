import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Cottonee extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 60;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [{
    name: 'Fickle Attack',
    cost: [P],
    damage: 30,
    text: 'Flip a coin. If tails, this attack does nothing.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '34';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Cottonee';
  public fullName: string = 'Cottonee PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      return COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          effect.damage = 0;
        }
      });
    }

    return state;
  }
}
