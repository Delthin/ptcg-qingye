import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Snorlaxex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 260;
  public weakness = [{ type: F }];
  public retreat = [C, C, C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Strength',
      cost: [C, C, C],
      damage: 80,
      text: ''
    },
    {
      name: 'Toss-and-Turn Press',
      cost: [C, C, C, C],
      damage: 120,
      damageCalculation: 'x',
      text: 'Flip 3 coins. This attack does 120 damage for each heads.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '76';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Snorlax ex';
  public fullName: string = 'Snorlax ex PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      return MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 3, results => {
        const heads = results.filter(result => result).length;
        effect.damage = 120 * heads;
      });
    }

    return state;
  }
}
