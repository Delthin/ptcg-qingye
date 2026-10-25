import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  COIN_FLIP_PROMPT, THIS_ATTACK_DOES_X_MORE_DAMAGE,
  THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN, WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Oinkologneex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Lechonk';
  public cardType: CardType[] = [C];
  public hp: number = 260;
  public weakness = [{ type: F }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Maddening Scent',
      cost: [C],
      damage: 10,
      damageCalculation: '+',
      text: 'This attack does 30 more damage for each of your opponent\'s Benched Pokémon.'
    },
    {
      name: 'Heavy Stomp',
      cost: [C, C, C],
      damage: 210,
      text: 'Flip a coin. If tails, during your next turn, this Pokémon can\'t attack.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '158';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Oinkologne ex';
  public fullName: string = 'Oinkologne ex SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;
      const benchedCount = opponent.bench.filter(b => b.cards.length > 0).length;

      if (benchedCount > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 30 * benchedCount);
      }
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN(player);
        }
      });
    }

    return state;
  }
}
