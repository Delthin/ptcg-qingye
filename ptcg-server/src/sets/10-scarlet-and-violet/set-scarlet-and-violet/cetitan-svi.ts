import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Cetitan extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Cetoddle';
  public cardType: CardType[] = [W];
  public hp: number = 180;
  public weakness = [{ type: M }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Hammer In',
      cost: [C, C],
      damage: 50,
      text: '',
    },
    {
      name: 'Sweeping Tackle',
      cost: [W, C, C],
      damage: 200,
      text: 'This attack does 20 less damage for each damage counter on this Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '60';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Cetitan';
  public fullName: string = 'Cetitan SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Sweeping Tackle: 200 minus 20 for each damage counter on this Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const pokemon = player.active;

      if (pokemon.getPokemonCard() === this) {
        const damageCounters = Math.floor(pokemon.damage / 10);
        effect.damage = Math.max(0, effect.damage - damageCounters * 20);
      }
    }

    return state;
  }
}
