import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_POKEMON_CANNOT_USE_THIS_ATTACK_NEXT_TURN, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED } from '../../../game/store/prefabs/attack-effects';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Magnezone extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Magneton';
  public cardType: CardType[] = [L];
  public hp: number = 170;
  public weakness = [{ type: F }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Mighty Magnetism',
      cost: [L, C, C],
      damage: 80,
      text: 'Your opponent\'s Active Pokémon is now Confused. During your opponent\'s next turn, that Pokémon can\'t retreat.',
    },
    {
      name: 'Zap Cannon',
      cost: [L, C, C, C],
      damage: 180,
      text: 'During your next turn, this Pokémon can\'t use Zap Cannon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '60';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Magnezone';
  public fullName: string = 'Magnezone SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
      state = BLOCK_RETREAT(store, state, effect, this);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_CANNOT_USE_THIS_ATTACK_NEXT_TURN(effect.player, 'Zap Cannon');
    }

    return state;
  }
}
