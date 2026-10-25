import { moveDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType } from '../../../game/store/card/card-types';
import { StoreLike } from '../../../game/store/store-like';
import { State } from '../../../game/store/state/state';
import { Effect } from '../../../game/store/effects/effect';
import { TrainerEffect } from '../../../game/store/effects/play-card-effects';
import { DamageMap, GameError, GameMessage, MoveDamagePrompt, PlayerType, SlotType, StateUtils } from '../../../game';

export class DamagePump extends TrainerCard {

  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'LOR';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '156';

  public regulationMark = 'F';

  public name: string = 'Damage Pump';

  public fullName: string = 'Damage Pump LOR';

  public text: string =
    'Move up to 2 damage counters from 1 of your Pokémon to your other Pokémon in any way you like.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;

      // Check if any Pokémon have damage
      let hasDamagedPokemon = false;
      let pokemonCount = 0;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        pokemonCount++;
        if (cardList.damage >= 10) hasDamagedPokemon = true;
      });

      if (!hasDamagedPokemon || pokemonCount < 2) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }

      const maxAllowedDamage: DamageMap[] = [];
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (cardList, card, target) => {
        maxAllowedDamage.push({ target, damage: cardList.damage + 20 });
      });

      effect.preventDefault = true;

      return store.prompt(state, new MoveDamagePrompt(
        effect.player.id,
        GameMessage.MOVE_DAMAGE,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        maxAllowedDamage,
        { min: 1, max: 2, allowCancel: false, blockedFrom: [], blockedTo: [], singleSourceTarget: true }
      ), transfers => {
        if (transfers === null) {
          player.hand.moveCardTo(effect.trainerCard, player.discard);
          return state;
        }

        for (const transfer of transfers) {
          const source = StateUtils.getTarget(state, player, transfer.from);
          const target = StateUtils.getTarget(state, player, transfer.to);
          state = moveDamageCounters(store, state, player, source, target, 10);
        }


        return state;
      });
    }
    return state;
  }

}