import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ABILITY_USED, ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON, BLOCK_IF_GX_ATTACK_USED,
  DISCARD_ALL_ENERGY_FROM_POKEMON, IS_ABILITY_BLOCKED, SWITCH_ACTIVE_WITH_BENCHED,
  USE_ABILITY_ONCE_PER_TURN, WAS_ATTACK_USED, WAS_POWER_USED
} from '../../../game/store/prefabs/prefabs';

export class SolgaleoGX extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Cosmoem';
  public cardType: CardType[] = [M];
  public hp: number = 250;
  public weakness = [{ type: R }];
  public resistance = [{ type: P, value: -20 }];
  public retreat = [C, C, C];

  protected _tags = [CardTag.POKEMON_GX];

  public powers = [{
    name: 'Ultra Road',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn (before your attack), you may switch your Active Pokémon with 1 of your Benched Pokémon.'
  }];

  public attacks = [
    {
      name: 'Sunsteel Strike',
      cost: [M, M, C],
      damage: 230,
      text: 'Discard all Energy from this Pokémon.'
    },
    {
      name: 'Sol Burst-GX',
      cost: [M],
      damage: 0,
      text: 'Search your deck for up to 5 Energy cards and attach them to your Pokémon in any way you like. Then, shuffle your deck. (You can\'t use more than 1 GX attack in a game.)'
    }
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '89';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Solgaleo-GX';
  public fullName: string = 'Solgaleo-GX 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      // Ability lock (Path to the Peak, Hex Maniac, etc.)
      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      // Nothing to switch with.
      if (!player.bench.some(bench => bench.cards.length > 0)) {
        return state;
      }

      USE_ABILITY_ONCE_PER_TURN(player, 'Ultra Road', this);
      ABILITY_USED(player, this);
      SWITCH_ACTIVE_WITH_BENCHED(store, state, player);
      return state;
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      DISCARD_ALL_ENERGY_FROM_POKEMON(store, state, effect, this);
      return state;
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      BLOCK_IF_GX_ATTACK_USED(player);
      state = ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(store, state, player, 5, 5);
      return state;
    }

    return state;
  }
}
