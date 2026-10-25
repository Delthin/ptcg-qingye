import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Drampa extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Gentle Slap',
      cost: [C],
      damage: 20,
      text: '',
    },
    {
      name: 'Raging Cannon',
      cost: [C, C, C],
      damage: 100,
      damageCalculation: '+',
      text: 'If all of your Benched Pokémon have at least 1 damage counter on them, this attack does 120 more damage.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '138';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Drampa';
  public fullName: string = 'Drampa TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const benched = player.bench.filter(b => b.cards.length > 0);

      if (benched.length > 0 && benched.every(b => b.damage >= 10)) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 120);
      }
    }
    return state;
  }
}
