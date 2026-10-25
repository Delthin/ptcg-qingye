import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { PlayerType, PowerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ABILITY_USED,
  ATTACH_ENERGY_PROMPT,
  IS_ABILITY_BLOCKED,
  USE_ABILITY_ONCE_PER_TURN,
  WAS_ATTACK_USED,
  WAS_POWER_USED
} from '../../../game/store/prefabs/prefabs';

export class Blissey extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Chansey';
  public cardType: CardType[] = [CardType.COLORLESS];
  public hp: number = 150;
  public weakness = [{ type: CardType.FIGHTING }];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [{
    name: 'Busybody Nurse',
    powerType: PowerType.ABILITY,
    useWhenInPlay: true,
    text: 'Once during your turn, you may use this Ability. Your Active Pokémon recovers from all Special Conditions.',
  }];

  public attacks = [{
    name: 'Happy Cyclone',
    cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    damage: 150,
    text: 'Move all Energy from this Pokémon to 1 of your Benched Pokémon.',
  }];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '145';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Blissey';
  public fullName: string = 'Blissey SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Ability: Busybody Nurse
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      USE_ABILITY_ONCE_PER_TURN(player, 'BUSYBODY_NURSE', this);
      ABILITY_USED(player, this);

      // Your Active Pokemon recovers from all Special Conditions.
      player.active.specialConditions = [];

      return state;
    }

    // Attack: Happy Cyclone
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const energyCount = player.active.energies.cards.length;
      const hasBench = player.bench.some(bench => bench.cards.length > 0);

      if (energyCount === 0 || !hasBench) {
        return state;
      }

      // Move all Energy from this Pokemon to 1 of your Benched Pokemon.
      return ATTACH_ENERGY_PROMPT(
        store,
        state,
        player,
        PlayerType.BOTTOM_PLAYER,
        SlotType.ACTIVE,
        [SlotType.BENCH],
        {},
        { allowCancel: false, min: energyCount, max: energyCount, sameTarget: true },
      );
    }

    return state;
  }
}
