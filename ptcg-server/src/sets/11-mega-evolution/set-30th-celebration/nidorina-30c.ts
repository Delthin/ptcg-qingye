import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { GameMessage, PlayerType, PowerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HealEffect } from '../../../game/store/effects/game-effects';
import { ChoosePokemonPrompt } from '../../../game/store/prompts/choose-pokemon-prompt';
import { ABILITY_USED, IS_ABILITY_BLOCKED, USE_ABILITY_ONCE_PER_TURN, WAS_POWER_USED } from '../../../game/store/prefabs/prefabs';

export class Nidorina extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public cardType: CardType[] = [D];
  public hp: number = 90;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public powers = [{
    name: 'Share Happiness',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, you may use this Ability. Heal 30 damage from 1 of your Pokémon.',
  }];

  public attacks = [{
    name: 'Bite',
    cost: [C, C],
    damage: 30,
    text: '',
  }];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '88';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Nidorina';
  public fullName: string = 'Nidorina 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      // Ability can be shut off by ability-locking effects.
      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      let hasDamagedPokemon = false;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        if (cardList.getPokemonCard() !== undefined && cardList.damage > 0) {
          hasDamagedPokemon = true;
        }
      });

      if (!hasDamagedPokemon) {
        return state;
      }

      USE_ABILITY_ONCE_PER_TURN(player, 'SHARE_HAPPINESS', this);
      ABILITY_USED(player, this);

      const next = store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_HEAL,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        { allowCancel: false, min: 1, max: 1 },
      ), targets => {
        if (targets.length === 0) {
          return;
        }

        const healEffect = new HealEffect(player, targets[0], 30);
        store.reduceEffect(state, healEffect);
      });

      return next ?? state;
    }

    return state;
  }
}
