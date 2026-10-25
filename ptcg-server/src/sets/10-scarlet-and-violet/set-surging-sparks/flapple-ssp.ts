import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Flapple extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Applin';
  public cardType: CardType[] = [N];
  public hp: number = 80;
  public retreat = [C];

  public attacks = [
    {
      name: 'Acidic Spit',
      cost: [C],
      damage: 20,
      damageCalculation: 'x',
      text: 'This attack does 20 damage for each damage counter on your opponent\'s Active Pokémon.',
    },
    {
      name: 'Speed Dive',
      cost: [G, R],
      damage: 70,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '139';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Flapple';
  public fullName: string = 'Flapple SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponentActive = effect.opponent.active;
      const damageCounters = Math.floor(opponentActive.damage / 10);
      effect.damage = 20 * damageCounters;
    }
    return state;
  }
}
