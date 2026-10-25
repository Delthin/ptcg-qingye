import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType } from '../../../game/store/card/card-types';
import { PlayerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_INTO_HAND, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Alcremie extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Milcery';
  public cardType: CardType[] = [P];
  public hp: number = 110;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Colorful Confection',
      cost: [C],
      damage: 0,
      text: 'Search your deck for up to 5 Pokémon that are the same type as any Basic Energy attached to this Pokémon, reveal them, and put them into your hand. Then, shuffle your deck.'
    },
    {
      name: 'Magical Shot',
      cost: [P, C],
      damage: 60,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '65';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Alcremie';
  public fullName: string = 'Alcremie SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const basicTypes: CardType[] = [];

      // Types provided by Basic Energy attached to this Pokémon.
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        if (cardList.getPokemonCard() !== this) {
          return;
        }

        cardList.cards.forEach(card => {
          if (card instanceof EnergyCard && card.energyType === EnergyType.BASIC) {
            card.provides.forEach(type => {
              if (!basicTypes.includes(type)) {
                basicTypes.push(type);
              }
            });
          }
        });
      });

      if (basicTypes.length === 0) {
        return state;
      }

      state = SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_INTO_HAND(
        store,
        state,
        player,
        { cardType: basicTypes },
        { min: 0, max: 5, allowCancel: false }
      );
    }

    return state;
  }
}
