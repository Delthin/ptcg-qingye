import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Blipbug extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 50;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [{
    name: 'Surprise Attack',
    cost: [G],
    damage: 30,
    text: 'Flip a coin. If tails, this attack does nothing.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '10';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Blipbug';
  public fullName: string = 'Blipbug PAR';

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
