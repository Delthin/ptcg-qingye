import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType } from '../../../game/store/card/card-types';
import { GameMessage, PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HealEffect } from '../../../game/store/effects/game-effects';
import { ChoosePokemonPrompt } from '../../../game/store/prompts/choose-pokemon-prompt';
import { WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class Saguaro extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;

  public regulationMark = 'G';

  public set: string = 'PAL';

  public setNumber: string = '187';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Saguaro';

  public fullName: string = 'Saguaro PAL';

  public text: string =
    'Choose up to 2 of your Pokémon and heal 50 damage from each of them.';

  private readonly HEAL_AMOUNT = 50;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_HEAL,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        { min: 0, max: 2, allowCancel: false },
      ), targets => {
        if (!targets || targets.length === 0) {
          return;
        }

        targets.forEach(target => {
          const healEffect = new HealEffect(player, target, this.HEAL_AMOUNT);
          store.reduceEffect(state, healEffect);
        });
      }) ?? state;
    }

    return state;
  }
}
