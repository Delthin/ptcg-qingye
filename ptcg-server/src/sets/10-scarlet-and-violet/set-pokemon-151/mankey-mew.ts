import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  COIN_FLIP_PROMPT,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  THIS_POKEMON_DOES_DAMAGE_TO_ITSELF,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Mankey extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 60;
  public weakness = [{ type: P }];
  public retreat = [C];

  public attacks = [{
    name: 'Thrash',
    cost: [F],
    damage: 20,
    damageCalculation: '+',
    text: 'Flip a coin. If tails, this Pokémon also does 20 damage to itself. If heads, this attack does 20 more damage.'
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '56';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mankey';
  public fullName: string = 'Mankey MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = COIN_FLIP_PROMPT(store, state, player, (result: boolean) => {
        if (result) {
          THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 20);
        } else {
          THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 20);
        }
      });
    }

    return state;
  }
}
