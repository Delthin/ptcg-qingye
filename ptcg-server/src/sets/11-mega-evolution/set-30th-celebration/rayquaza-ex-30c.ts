import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardTag, CardType, Stage } from '../../../game/store/card/card-types';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { BLOCK_IF_DECK_EMPTY, MOVE_CARDS, SELECT_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class RayquazaEX extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [N];
  public hp: number = 170;
  public weakness = [{ type: N }];
  public retreat = [C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Celestial Roar',
      cost: [C],
      damage: 0,
      text: 'Discard the top 3 cards of your deck. If any of those cards are Energy cards, attach them to this Pokémon.'
    },
    {
      name: 'Dragon Burst',
      cost: [R, L],
      damage: 60,
      damageCalculation: 'x',
      text: 'Discard all basic Fire Energy or all basic Lightning Energy attached to this Pokémon. This attack does 60 damage times the number of Energy cards you discarded.'
    }
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '85';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Rayquaza-EX';
  public fullName: string = 'Rayquaza-EX 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Celestial Roar
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      BLOCK_IF_DECK_EMPTY(player);

      const topCards = player.deck.cards.slice(-3);
      const energyCards = topCards.filter(card => card instanceof EnergyCard);
      const otherCards = topCards.filter(card => !(card instanceof EnergyCard));

      if (energyCards.length > 0) {
        state = MOVE_CARDS(store, state, player.deck, player.active, { cards: energyCards });
      }
      if (otherCards.length > 0) {
        state = MOVE_CARDS(store, state, player.deck, player.discard, { cards: otherCards });
      }
      return state;
    }

    // Dragon Burst
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const pokemon = player.active;

      effect.damage = 0;

      const attachedEnergy = pokemon.cards.filter((card): card is EnergyCard => card instanceof EnergyCard);
      const fireEnergy = attachedEnergy.filter(card => card.name.includes('Fire Energy'));
      const lightningEnergy = attachedEnergy.filter(card => card.name.includes('Lightning Energy'));

      const discardAllOf = (cards: EnergyCard[]): State => {
        effect.damage = 60 * cards.length;
        return MOVE_CARDS(store, state, pokemon, player.discard, { cards: cards });
      };

      if (fireEnergy.length > 0 && lightningEnergy.length === 0) {
        state = discardAllOf(fireEnergy);
      } else if (lightningEnergy.length > 0 && fireEnergy.length === 0) {
        state = discardAllOf(lightningEnergy);
      } else if (fireEnergy.length > 0 && lightningEnergy.length > 0) {
        state = SELECT_PROMPT(
          store, state, player,
          ['Discard all basic Fire Energy', 'Discard all basic Lightning Energy'],
          (result) => {
            state = discardAllOf(result === 0 ? fireEnergy : lightningEnergy);
          });
      }
      return state;
    }

    return state;
  }
}
