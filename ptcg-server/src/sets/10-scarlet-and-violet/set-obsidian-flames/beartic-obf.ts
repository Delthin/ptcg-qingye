import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, DISCARD_ALL_ENERGY_FROM_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Beartic extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Cubchoo';
  public cardType: CardType[] = [W];
  public hp: number = 150;
  public weakness = [{ type: M }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Icicle Punch',
      cost: [W],
      damage: 30,
      text: ''
    },
    {
      name: 'Frost Purge',
      cost: [W, W, C],
      damage: 170,
      text: 'Flip a coin. If tails, discard all Energy from this Pokémon.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '54';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Beartic';
  public fullName: string = 'Beartic OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          DISCARD_ALL_ENERGY_FROM_POKEMON(store, state, effect, this);
        }
      });
    }

    return state;
  }
}
