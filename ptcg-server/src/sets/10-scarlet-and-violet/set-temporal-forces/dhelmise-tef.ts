import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Dhelmise extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Spinning Attack',
      cost: [C, C],
      damage: 30,
      text: '',
    },
    {
      name: 'Steel Anchor',
      cost: [G, G, C],
      damage: 80,
      damageCalculation: '+',
      text: 'If you have any Metal Pokémon on your Bench, this attack does 80 more damage.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '19';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Dhelmise';
  public fullName: string = 'Dhelmise TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      const hasMetalOnBench = player.bench.some(bench => {
        const pokemon = bench.getPokemonCard();
        return pokemon !== undefined && pokemon.cardType.includes(CardType.METAL);
      });

      if (hasMetalOnBench) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 80);
      }
    }

    return state;
  }
}
