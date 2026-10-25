import { moveDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { StoreLike } from '../../../game/store/store-like';
import { State } from '../../../game/store/state/state';
import { Player } from '../../../game/store/state/player';
import { Effect } from '../../../game/store/effects/effect';
import { StateUtils } from '../../../game/store/state-utils';
import { PlayerType, SlotType, CardTarget } from '../../../game/store/actions/play-card-action';
import { MoveDamagePrompt } from '../../../game/store/prompts/move-damage-prompt';
import { GameError } from '../../../game/game-error';
import { GameMessage } from '../../../game/game-message';
import { TrainerCard, TrainerType } from '../../../game';
import { TrainerEffect } from '../../../game/store/effects/play-card-effects';

export class Agatha extends TrainerCard {

  public regulationMark = 'E';
  public trainerType: TrainerType = TrainerType.SUPPORTER;
  public set = 'CRE';
  public cardImage = 'assets/cardback.png';
  public setNumber = '129';
  public name = 'Agatha';
  public fullName = 'Agatha CRE';
  public text = 'Move up to 3 damage counters from your Active Pokémon to your opponent\'s Active Pokémon.';

  public canPlay(_store: StoreLike, state: State, player: Player): boolean {
    const opponent = StateUtils.getOpponent(state, player);
    return player.active.getPokemonCard() !== undefined && player.active.damage >= 10
      && opponent.active.getPokemonCard() !== undefined;
  }

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (!(effect instanceof TrainerEffect) || effect.trainerCard !== this) return state;
    const player = effect.player;
    if (player.supporterTurn > 0) throw new GameError(GameMessage.SUPPORTER_ALREADY_PLAYED);
    if (!this.canPlay(store, state, player)) throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
    const opponent = StateUtils.getOpponent(state, player);
    const from: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
    const to: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 };
    const max = Math.min(3, Math.floor(player.active.damage / 10));

    return store.prompt(state, new MoveDamagePrompt(
      player.id,
      GameMessage.MOVE_DAMAGE,
      PlayerType.ANY,
      [SlotType.ACTIVE],
      [{ target: to, damage: opponent.active.damage + max * 10 }],
      {
        min: 1, max, allowCancel: false,
        blockedFrom: [to], blockedTo: [from],
        singleSourceTarget: true, singleDestinationTarget: true,
      }
    ), transfers => {
      if (transfers === null) return;
      for (const transfer of transfers) {
        const source = StateUtils.getTarget(state, player, transfer.from);
        const target = StateUtils.getTarget(state, player, transfer.to);
        state = moveDamageCounters(store, state, player, source, target, 10);
      }
    });
  }
}
