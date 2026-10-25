import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class TingLu extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 140;
  public weakness = [{ type: G }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Sand Bringer',
      cost: [F],
      damage: 0,
      text: 'Attach up to 2 Basic [F] Energy cards from your discard pile to 1 of your Pokémon.'
    },
    {
      name: 'Arrogant Impact',
      cost: [F, F, F],
      damage: 220,
      text: 'If this Pokémon has 4 or more damage counters on it, this attack does nothing.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '109';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Ting-Lu';
  public fullName: string = 'Ting-Lu PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      // Attach up to 2 Basic [F] Energy cards from your discard pile to 1 of your Pokémon.
      return ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON(store, state, player, 2, F);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      // 4 damage counters = 40 damage (damage is stored in HP units).
      if (player.active.damage >= 40) {
        effect.damage = 0;
      }
    }

    return state;
  }
}
