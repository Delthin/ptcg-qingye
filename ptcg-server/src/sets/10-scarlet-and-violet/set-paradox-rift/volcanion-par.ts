import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Volcanion extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 130;
  public weakness = [{ type: W }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Dual Turbo',
      cost: [R],
      damage: 20,
      text: 'Choose up to 2 of your Benched Pokémon and attach a Basic Fire Energy card from your discard pile to each of them.'
    },
    {
      name: 'Heavy Impact',
      cost: [R, C, C, C],
      damage: 120,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '22';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Volcanion';
  public fullName: string = 'Volcanion PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // "Choose up to 2 of your Benched Pokemon and attach a Basic Fire Energy card
      // from your discard pile to each of them." The engine helper resolves one
      // Pokemon + Basic [R] Energy attach per call, so run it twice for the two slots.
      state = ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON(
        store, state, player, 1, CardType.FIRE
      );
      state = ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON(
        store, state, player, 1, CardType.FIRE
      );
    }
    return state;
  }
}
