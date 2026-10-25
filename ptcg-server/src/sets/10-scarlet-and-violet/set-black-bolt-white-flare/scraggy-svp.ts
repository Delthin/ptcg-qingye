import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Scraggy extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 60;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [{
    name: 'Kick Shot',
    cost: [D],
    damage: 30,
    text: 'Flip a coin. If tails, this attack does nothing.',
  }];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '186';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Scraggy';
  public fullName: string = 'Scraggy SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
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
