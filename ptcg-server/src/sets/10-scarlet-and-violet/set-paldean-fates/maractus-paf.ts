import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS, MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Maractus extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 110;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Double Draw',
      cost: [C],
      damage: 0,
      text: 'Draw 2 cards.',
    },
    {
      name: 'Pin Missile',
      cost: [C, C, C],
      damage: 30,
      damageCalculation: 'x',
      text: 'Flip 4 coins. This attack does 30 damage for each heads.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '3';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Maractus';
  public fullName: string = 'Maractus PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = DRAW_CARDS(store, state, player, 2);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const attackEffect = effect;
      const player = attackEffect.player;
      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 4, results => {
        const heads = results.filter(result => result).length;
        attackEffect.damage = 30 * heads;
      });
    }

    return state;
  }
}
