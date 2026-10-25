import { PlayerType, State, StoreLike } from '../../../game';
import { CardTag, TrainerType } from '../../../game/store/card/card-types';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { Effect } from '../../../game/store/effects/effect';
import { AttackEffect } from '../../../game/store/effects/game-effects';
import { DISCARD_ALL_ENERGY_FROM_POKEMON } from '../../../game/store/prefabs/prefabs';

export class TechnicalMachineFluorite extends TrainerCard {
  public trainerType: TrainerType = TrainerType.TOOL;
  public set: string = 'SSP';
  public setNumber: string = '188';
  public regulationMark = 'H';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Technical Machine: Fluorite';
  public fullName: string = 'Technical Machine: Fluorite SSP';

  public text: string =
    'The Pokémon this card is attached to can use the attack on this card. ' +
    '(You still need the necessary Energy to use this attack.) If this card is ' +
    'attached to 1 of your Pokémon, discard it at the end of your turn.';

  public attacks = [
    {
      name: 'Fluorite',
      cost: [G, W, P],
      damage: 0,
      text: 'Discard all Energy from this Pokémon, and heal all damage from each of your Tera Pokémon.',
    },
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // This card reacts to the attack printed on itself. A Pokémon Tool is not a
    // PokemonCard, so the attack is matched by the printed attack it carries and by
    // being attached to the Pokémon that used it.
    if (!(effect instanceof AttackEffect) || effect.attack.name !== 'Fluorite') {
      return state;
    }

    if (!effect.player.active.tools.includes(this)) {
      return state;
    }

    const player = effect.player;

    DISCARD_ALL_ENERGY_FROM_POKEMON(store, state, effect, this);

    player.forEachPokemon(PlayerType.BOTTOM_PLAYER, pokemon => {
      const pokemonCard = pokemon.getPokemonCard();
      if (pokemonCard === undefined || !TechnicalMachineFluorite.isTeraPokemon(pokemonCard)) {
        return;
      }
      pokemon.damage = 0;
    });

    return state;
  }

  private static isTeraPokemon(card: PokemonCard): boolean {
    // Read the card tags structurally: the tag list lives on the Pokémon card
    // instance while tool cards only need to inspect it.
    const tags = (card as unknown as { _tags?: CardTag[] })._tags ?? [];
    return tags.includes(CardTag.POKEMON_TERA);
  }
}
