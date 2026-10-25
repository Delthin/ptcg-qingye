import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';
import { DISCARD_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class Arcanine extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Growlithe';
  public cardType: CardType[] = [R];
  public hp: number = 150;
  public weakness = [{ type: W }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Torrid Torrent',
      cost: [R],
      damage: 30,
      text: 'Attach up to 2 Basic Fire Energy cards from your discard pile to this Pokémon.',
    },
    {
      name: 'Dynamite Fang',
      cost: [R, R, C, C],
      damage: 240,
      text: 'Discard 2 Fire Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '59';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Arcanine';
  public fullName: string = 'Arcanine MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Torrid Torrent: attach up to 2 Basic Fire Energy from discard to this Pokémon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON(
        store, state, player, 2, CardType.FIRE
      );
    }

    // Dynamite Fang: discard 2 Fire Energy from this Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_X_ENERGY_FROM_THIS_POKEMON(
        store, state, effect, 2, CardType.FIRE
      );
    }

    return state;
  }
}
