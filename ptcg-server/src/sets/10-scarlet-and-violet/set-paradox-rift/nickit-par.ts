import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Nickit extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 70;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [{
    name: 'Surprise Attack',
    cost: [C],
    damage: 30,
    text: 'Flip a coin. If tails, this attack does nothing.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '119';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Nickit';
  public fullName: string = 'Nickit PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const attackEffect = effect;
      return COIN_FLIP_PROMPT(store, state, attackEffect.player, result => {
        if (!result) {
          attackEffect.damage = 0;
        }
      });
    }

    return state;
  }
}
