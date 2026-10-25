import { moveDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { PlayerType, SlotType } from '../../../game/store/actions/play-card-action';
import { GameMessage } from '../../../game/game-message';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType } from '../../../game/store/card/card-types';
import { StoreLike } from '../../../game/store/store-like';
import { State } from '../../../game/store/state/state';
import { Effect } from '../../../game/store/effects/effect';
import { TrainerEffect } from '../../../game/store/effects/play-card-effects';
import { DamageMap, GameError, MoveDamagePrompt, StateUtils } from '../../../game';

export class Grimsley extends TrainerCard {

  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'UNM';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '199';

  public name: string = 'Grimsley';

  public fullName: string = 'Grimsley UNM';

  public text: string =
    'Move up to 3 damage counters from 1 of your opponent\'s Pokémon to another of their Pokémon.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      const supporterTurn = player.supporterTurn;

      if (supporterTurn > 0) {
        throw new GameError(GameMessage.SUPPORTER_ALREADY_PLAYED);
      }

      const damagedPokemon = [
        ...opponent.bench.filter(b => b.cards.length > 0 && b.damage >= 10),
        ...(opponent.active.damage >= 10 ? [opponent.active] : [])
      ];

      let pokemonCount = 0;
      opponent.forEachPokemon(PlayerType.TOP_PLAYER, () => pokemonCount++);
      if (damagedPokemon.length === 0 || pokemonCount < 2) {
        throw new GameError(GameMessage.CANNOT_MOVE_DAMAGE);
      }

      player.hand.moveCardTo(effect.trainerCard, player.supporter);
      // We will discard this card after prompt confirmation
      effect.preventDefault = true;

      const maxAllowedDamage: DamageMap[] = [];
      opponent.forEachPokemon(PlayerType.TOP_PLAYER, (cardList, card, target) => {
        maxAllowedDamage.push({ target, damage: cardList.damage + 30 });
      });

      return store.prompt(state, new MoveDamagePrompt(
        effect.player.id,
        GameMessage.MOVE_DAMAGE,
        PlayerType.TOP_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        maxAllowedDamage,
        { min: 1, max: 3, allowCancel: false, singleSourceTarget: true, singleDestinationTarget: true }
      ), transfers => {
        if (transfers === null) {
          player.supporter.moveCardTo(this, player.discard);
          return state;
        }

        for (const transfer of transfers) {
          const source = StateUtils.getTarget(state, player, transfer.from);
          const target = StateUtils.getTarget(state, player, transfer.to);
          state = moveDamageCounters(store, state, player, source, target, 10);
        }

        player.supporter.moveCardTo(this, player.discard);
        return state;
      });
    }

    return state;
  }

}
