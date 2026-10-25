import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED } from '../../../game/store/prefabs/attack-effects';

export class Loudred extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Whismur';
  public cardType: CardType[] = [C];
  public hp: number = 100;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Body Slam',
      cost: [C],
      damage: 10,
      text: 'Flip a coin. If heads, your opponent\'s Active Pokémon is now Paralyzed.'
    },
    {
      name: 'Mega Impact',
      cost: [C, C],
      damage: 40,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '149';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Loudred';
  public fullName: string = 'Loudred PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED(store, state, effect);
        }
      });
    }

    return state;
  }
}
