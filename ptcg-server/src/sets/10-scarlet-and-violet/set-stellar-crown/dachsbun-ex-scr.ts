import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { PlayerType, PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { EnergyCard } from '../../../game/store/card/energy-card';
import {
  CONFIRMATION_PROMPT, IS_ABILITY_BLOCKED, JUST_EVOLVED, MOVE_CARDS, WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED } from '../../../game/store/prefabs/attack-effects';

export class Dachsbunex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Fidough';
  public cardType: CardType[] = [P];
  public hp: number = 250;
  public weakness = [{ type: M }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public powers = [
    {
      name: 'Time to Chow Down',
      powerType: PowerType.ABILITY,
      text: 'When you play this Pokémon from your hand to evolve 1 of your Pokémon during your turn, you may heal all damage from each of your Evolution Pokémon. If you healed any damage in this way, discard all Energy from those Pokémon.'
    }
  ];

  public attacks = [
    {
      name: 'Wonder Shine',
      cost: [C, C],
      damage: 130,
      text: 'Your opponent\'s Active Pokémon is now Confused.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '67';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Dachsbun ex';
  public fullName: string = 'Dachsbun ex SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (JUST_EVOLVED(effect, this)) {
      const player = effect.player;

      // Check to see if anything is blocking our Ability
      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      state = CONFIRMATION_PROMPT(store, state, player, useAbility => {
        if (!useAbility) {
          return;
        }

        let healedAnyDamage = false;

        player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
          const pokemonCard = cardList.getPokemonCard();

          if (pokemonCard === undefined) {
            return;
          }

          const isEvolutionPokemon = pokemonCard === this || pokemonCard.stage !== Stage.BASIC;

          if (isEvolutionPokemon && cardList.damage > 0) {
            healedAnyDamage = true;
          }
        });

        if (!healedAnyDamage) {
          return;
        }

        player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
          const pokemonCard = cardList.getPokemonCard();

          if (pokemonCard === undefined) {
            return;
          }

          const isEvolutionPokemon = pokemonCard === this || pokemonCard.stage !== Stage.BASIC;

          if (!isEvolutionPokemon || cardList.damage === 0) {
            return;
          }

          // Heal all damage from this Evolution Pokémon
          cardList.damage = 0;

          // Then discard all Energy attached to it
          const attachedEnergy = cardList.cards.filter(card => card instanceof EnergyCard);

          if (attachedEnergy.length > 0) {
            state = MOVE_CARDS(store, state, cardList, player.discard, { cards: attachedEnergy });
          }
        });
      });
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
    }

    return state;
  }
}
