import { TrainerCard } from '../../../game/store/card/trainer-card';
import { CardTag, TrainerType } from '../../../game/store/card/card-types';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SELECT_PROMPT } from '../../../game/store/prefabs/prefabs';
import { WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class OgresMask extends TrainerCard {

  public trainerType = TrainerType.ITEM;

  public regulationMark = 'H';

  public set: string = 'PRE';

  public setNumber: string = '118';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Ogre\'s Mask';

  public fullName: string = 'Ogre\'s Mask PRE';

  public text: string =
    'Choose a Pokémon ex in your discard pile that has "Ogerpon" in its name, and switch it with ' +
    '1 of your Pokémon ex in play that has "Ogerpon" in its name. Any attached cards, damage counters, ' +
    'Special Conditions, turns in play, and any other effects remain on the new Pokémon.\n\n' +
    'You may play any number of Item cards during your turn.';

  private isOgerponEx(card: PokemonCard): boolean {
    return card.tags.includes(CardTag.POKEMON_ex) && card.name.includes('Ogerpon');
  }

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      // "Ogerpon" ex cards that can come back from the discard pile.
      const discardTargets = player.discard.cards.filter(
        (card): card is PokemonCard => card instanceof PokemonCard && this.isOgerponEx(card),
      );

      // "Ogerpon" ex cards currently in play (Active Spot or Bench).
      const slots = [player.active, ...player.bench];
      const playTargets = slots
        .map((slot, index) => {
          const pokemon = slot.getPokemonCard();
          const position = index === 0 ? 'Active Spot' : `Bench ${index}`;
          return { slot, pokemon, label: pokemon === undefined ? '' : `${pokemon.name} (${position})` };
        })
        .filter(target => target.pokemon !== undefined && this.isOgerponEx(target.pokemon));

      if (discardTargets.length === 0 || playTargets.length === 0) {
        return state;
      }

      state = SELECT_PROMPT(
        store, state, player,
        discardTargets.map(card => card.name),
        discardChoice => {
          const newPokemon = discardTargets[discardChoice];

          state = SELECT_PROMPT(
            store, state, player,
            playTargets.map(target => target.label),
            playChoice => {
              const target = playTargets[playChoice];
              if (newPokemon === undefined || target === undefined) {
                return;
              }

              const oldPokemon = target.pokemon;
              if (oldPokemon === undefined) {
                return;
              }

              const slot = target.slot;

              // The chosen Pokémon ex leaves the discard pile.
              const discardIndex = player.discard.cards.indexOf(newPokemon);
              if (discardIndex !== -1) {
                player.discard.cards.splice(discardIndex, 1);
              }

              // The new Pokémon ex takes the exact same spot, so all attached
              // cards, damage counters, Special Conditions, turns in play and
              // any other effects stay on it.
              const slotIndex = slot.cards.indexOf(oldPokemon);
              if (slotIndex !== -1) {
                slot.cards[slotIndex] = newPokemon;
              } else {
                slot.cards.unshift(newPokemon);
              }

              // The Pokémon that was switched out goes to the discard pile.
              player.discard.cards.push(oldPokemon);
            },
          );
        },
      );
    }

    return state;
  }
}
