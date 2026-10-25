import { PokemonCard, State, StoreLike, StateUtils, GameMessage, PlayerType, SlotType } from '../../../game';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { Effect } from '../../../game/store/effects/effect';
import { AFTER_ATTACK, SHUFFLE_DECK, SWITCH_OUT_OPPONENT_ACTIVE_POKEMON } from '../../../game/store/prefabs/prefabs';
import { SHUFFLE_THIS_POKEMON_AND_ALL_ATTACHED_CARDS_INTO_YOUR_DECK } from '../../../game/store/prefabs/attack-effects';
import { ChoosePokemonPrompt } from '../../../game/store/prompts/choose-pokemon-prompt';

export class Butterfree extends PokemonCard {
  public regulationMark = 'G';
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Metapod';
  public cardType: CardType[] = [G];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [{
    name: 'Whirlwind',
    cost: [G],
    damage: 60,
    text: 'Switch out your opponent\'s Active Pokémon to the Bench. (Your opponent chooses the new Active Pokémon.)',
  }, {
    name: 'Bye-Bye Flight',
    cost: [C, C],
    damage: 0,
    text: 'Choose 1 of your opponent\'s Benched Pokémon. Shuffle that Pokémon and all attached cards into their deck, and then shuffle this Pokémon and all attached cards into your deck. If your opponent has no Benched Pokémon, this attack does nothing.',
  }];

  public set: string = 'MEW';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '12';
  public name: string = 'Butterfree';
  public fullName: string = 'Butterfree MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Whirlwind
    if (AFTER_ATTACK(effect, 0, this)) {
      return SWITCH_OUT_OPPONENT_ACTIVE_POKEMON(store, state, effect.player, {
        sourceEffect: effect,
      });
    }

    // Bye-Bye Flight
    if (AFTER_ATTACK(effect, 1, this)) {
      const afterAttack = effect;
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      const hasBenchedPokemon = opponent.bench.some(bench => bench.cards.length > 0);

      // "If your opponent has no Benched Pokémon, this attack does nothing."
      if (!hasBenchedPokemon) {
        return state;
      }

      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_SHUFFLE,
        PlayerType.TOP_PLAYER,
        [SlotType.BENCH],
        { min: 1, max: 1, allowCancel: false },
      ), selected => {
        if (!selected || selected.length === 0) {
          return;
        }

        const benchSlot = selected[0];

        // Shuffle the chosen Benched Pokémon and all attached cards (tools, energy, evolutions)
        // into the opponent's deck. Tools live in a separate array, so move them first, then the
        // remaining cards; re-reading `cards` avoids moving a tool twice.
        const toolsToMove = benchSlot.tools.slice();
        toolsToMove.forEach(card => benchSlot.moveCardTo(card, opponent.deck));
        const cardsToMove = benchSlot.cards.slice();
        cardsToMove.forEach(card => benchSlot.moveCardTo(card, opponent.deck));
        benchSlot.clearEffects();
        SHUFFLE_DECK(store, state, opponent);

        // Then shuffle this Pokémon and all attached cards into your deck.
        SHUFFLE_THIS_POKEMON_AND_ALL_ATTACHED_CARDS_INTO_YOUR_DECK(store, state, afterAttack);
      });
    }

    return state;
  }
}
