import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag, EnergyType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON,
  BLOCK_IF_DECK_EMPTY,
  BLOCK_IF_VSTAR_POWER_USED,
  SEARCH_DECK_FOR_CARDS_TO_HAND,
  WAS_ATTACK_USED,
  WAS_POWER_USED
} from '../../../game/store/prefabs/prefabs';

export class ArceusVSTAR extends PokemonCard {
  protected _tags = [CardTag.POKEMON_VSTAR];
  public stage: Stage = Stage.VSTAR;
  public evolvesFrom = 'Arceus V';
  public cardType: CardType[] = [C];
  public hp: number = 280;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public powers = [{
    name: 'Starbirth',
    powerType: PowerType.ABILITY,
    useWhenInPlay: true,
    text: 'During your turn, you may search your deck for up to 2 cards and put them into your hand. Then, shuffle your deck. (You can\'t use more than 1 VSTAR Power in a game.)'
  }];

  public attacks = [{
    name: 'Trinity Nova',
    cost: [C, C, C],
    damage: 200,
    text: 'Search your deck for up to 3 basic Energy cards and attach them to your Pokémon V in any way you like. Then, shuffle your deck.'
  }];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '123';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Arceus VSTAR';
  public fullName: string = 'Arceus VSTAR 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Starbirth (VSTAR Power): search up to 2 cards, then shuffle.
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      // Only 1 VSTAR Power may be used in a game.
      BLOCK_IF_VSTAR_POWER_USED(player);
      BLOCK_IF_DECK_EMPTY(player);
      player.usedVSTAR = true;

      SEARCH_DECK_FOR_CARDS_TO_HAND(store, state, player, this, {}, { min: 0, max: 2 }, effect);
      return state;
    }

    // Trinity Nova: attach up to 3 basic Energy cards from the deck to your Pokémon V.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      return ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(store, state, player, 3, 3,
        { energyFilter: { energyType: EnergyType.BASIC }, targetFilter: target => target.vPokemon() });
    }

    return state;
  }
}
