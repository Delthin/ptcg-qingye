import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Heracross extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Tackle',
      cost: [G, G],
      damage: 50,
      text: '',
    },
    {
      name: 'Smashing Horn',
      cost: [G, G, G],
      damage: 110,
      text: 'This attack\'s damage isn\'t affected by Resistance.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '6';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Heracross';
  public fullName: string = 'Heracross PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Smashing Horn: this attack's damage isn't affected by Resistance.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      effect.ignoreResistance = true;
    }
    return state;
  }
}
