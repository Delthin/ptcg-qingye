import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Kangaskhan extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Gentle Slap',
    cost: [C, C],
    damage: 50,
    text: '',
  }, {
    name: 'Dizzy Punch',
    cost: [C, C, C],
    damage: 90,
    damageCalculation: 'x',
    text: 'Flip 2 coins. This attack does 90 damage for each heads.',
  }];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '151';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Kangaskhan';
  public fullName: string = 'Kangaskhan DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      return MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 2, results => {
        const heads = results.filter(result => result).length;
        effect.damage = 90 * heads;
      });
    }

    return state;
  }
}
