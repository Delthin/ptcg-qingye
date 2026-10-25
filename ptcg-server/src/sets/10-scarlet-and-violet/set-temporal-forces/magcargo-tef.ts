import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MoveCardsEffect } from '../../../game/store/effects/game-effects';
import { ADD_BURN_TO_PLAYER_ACTIVE, IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class Magcargo extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Slugma';
  public cardType: CardType[] = [R];
  public hp: number = 120;
  public weakness = [{ type: W }];
  public retreat = [C, C, C, C];

  public powers = [{
    name: 'Lava Zone',
    powerType: PowerType.ABILITY,
    text: 'Whenever your opponent\'s Active Pokémon moves to the Bench during their turn, their new Active Pokémon is now Burned.',
  }];

  public attacks = [{
    name: 'Heat Blast',
    cost: [R, C, C],
    damage: 100,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '29';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Magcargo';
  public fullName: string = 'Magcargo TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (!(effect instanceof MoveCardsEffect)) {
      return state;
    }

    // Find the player who has this Magcargo in play (Active or Bench).
    const player = state.players.find(p =>
      p.active.getPokemonCard() === this
      || p.bench.some(slot => slot.getPokemonCard() === this));

    if (player === undefined) {
      return state;
    }

    const opponent = StateUtils.getOpponent(state, player);

    // Lava Zone triggers when the opponent's Active Pokémon leaves the
    // Active Spot for one of their own Bench spots.
    const activeMovedToBench = effect.source === opponent.active
      && opponent.bench.some(slot => slot === effect.destination);

    if (!activeMovedToBench) {
      return state;
    }

    if (IS_ABILITY_BLOCKED(store, state, player, this)) {
      return state;
    }

    ADD_BURN_TO_PLAYER_ACTIVE(store, state, opponent, this);

    return state;
  }
}
