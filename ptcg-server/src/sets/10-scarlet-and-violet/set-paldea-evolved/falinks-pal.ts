import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  GET_PLAYER_BENCH_SLOTS,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Falinks extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 110;
  public weakness = [{ type: P }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Headbutt',
      cost: [C],
      damage: 20,
      text: '',
    },
    {
      name: 'Reckless Charge Together',
      cost: [F, C, C],
      damage: 70,
      damageCalculation: '+',
      text: 'If Falinks is on your Bench, this attack does 90 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '119';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Falinks';
  public fullName: string = 'Falinks PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const benchSlots = GET_PLAYER_BENCH_SLOTS(player);

      const hasFalinksOnBench = benchSlots.some(slot => {
        const pokemon = slot.getPokemonCard();
        return pokemon !== undefined && pokemon.name === 'Falinks';
      });

      if (hasFalinksOnBench) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 90);
      }
    }

    return state;
  }
}
