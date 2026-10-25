import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { GameMessage, PlayerType, SlotType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChoosePokemonPrompt } from '../../../game/store/prompts/choose-pokemon-prompt';
import { DAMAGE_OPPONENT_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class Grimmsnarl extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Morgrem';
  public cardType: CardType[] = [D];
  public hp: number = 170;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Goad \'n\' Grab',
      cost: [C, C],
      damage: 0,
      text: 'Switch out your opponent\'s Active Pokémon to the Bench. (Your opponent chooses the new Active Pokémon.) If you do, this attack does 160 damage to the new Active Pokémon.'
    },
    {
      name: 'Knuckle Sandwich',
      cost: [D, C, C],
      damage: 160,
      text: 'Discard 2 Energy from this Pokémon.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '96';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Grimmsnarl';
  public fullName: string = 'Grimmsnarl SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Goad 'n' Grab
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const attackEffect = effect;
      const player = attackEffect.player;
      const opponent = StateUtils.getOpponent(state, player);
      const hasBench = opponent.bench.some(b => b.cards.length > 0);

      // Nothing to switch out: no switch happened, so no damage is dealt.
      if (!hasBench) {
        return state;
      }

      // The opponent chooses which of their Benched Pokémon becomes the new Active Pokémon.
      const nextState = store.prompt(state, new ChoosePokemonPrompt(
        opponent.id,
        GameMessage.CHOOSE_POKEMON_TO_SWITCH,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { allowCancel: false },
      ), targets => {
        if (!targets || targets.length === 0) {
          return state;
        }

        opponent.switchPokemon(targets[0]);

        // If the Active Pokémon was switched out, this attack does 160 damage to the new Active Pokémon.
        DAMAGE_OPPONENT_POKEMON(store, state, attackEffect, 160, [opponent.active]);

        return state;
      });

      return nextState ?? state;
    }

    // Knuckle Sandwich
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 2, {}, 2);
    }

    return state;
  }
}
