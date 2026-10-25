import { GameError } from '../../game/game-error';
import { GameMessage } from '../../game/game-message';
import { TrainerType } from '../../game/store/card/card-types';
import { TrainerCard } from '../../game/store/card/trainer-card';
import { Effect } from '../../game/store/effects/effect';
import { HealEffect } from '../../game/store/effects/game-effects';
import { TrainerEffect } from '../../game/store/effects/play-card-effects';
import { DRAW_CARDS } from '../../game/store/prefabs/prefabs';
import { Player } from '../../game/store/state/player';
import { State } from '../../game/store/state/state';
import { StoreLike } from '../../game/store/store-like';

export class PokemonBreeder extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;
  public set = 'SLG';
  public setNumber = '63';
  public cardImage = 'assets/cardback.png';
  public name = 'Pokemon Breeder';
  public fullName = 'Pokemon Breeder SLG';
  public text = 'Draw 2 cards and heal 20 damage from your Active Pokémon.';

  public canPlay(store: StoreLike, state: State, player: Player): boolean {
    if (player.supporterTurn > 0) return false;
    return player.deck.cards.length > 0 ||
      (player.active.cards.length > 0 && player.active.damage > 0 && !player.active.cannotBeHealedNextTurn);
  }

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (!(effect instanceof TrainerEffect) || effect.trainerCard !== this) return state;
    if (effect.player.supporterTurn > 0) {
      throw new GameError(GameMessage.SUPPORTER_ALREADY_PLAYED);
    }
    if (!this.canPlay(store, state, effect.player)) {
      throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
    }
    state = DRAW_CARDS(store, state, effect.player, 2);
    return store.reduceEffect(state, new HealEffect(effect.player, effect.player.active, 20));
  }
}
