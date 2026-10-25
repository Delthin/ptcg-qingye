import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType } from '../../../game/store/card/card-types';
import { ChooseCardsPrompt, GameMessage, PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { PUT_X_DAMAGE_COUNTERS_IN_ANY_WAY_YOU_LIKE } from '../../../game/store/prefabs/attack-effects';

export class Gengar extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Haunter';
  public cardType: CardType[] = [P];
  public hp: number = 130;
  public weakness = [{ type: D }];
  public resistance = [{ type: C, value: -20 }];
  public retreat = [];

  public powers = [{
    name: 'Catastrophe',
    powerType: PowerType.ABILITY,
    text: 'As long as Gengar is your Active Pokémon, if any of your opponent\'s Pokémon would be Knocked Out, put that Pokémon in the Lost Zone instead of discarding. (Discard all cards attached to that Pokémon.)',
  }];

  public attacks = [
    {
      name: 'Hurl into Darkness',
      cost: [P],
      damage: 0,
      text: 'Look at your opponent\'s hand and choose a number of Pokémon you find there up to the number of Psychic Energy attached to Gengar. Put the Pokémon you chose in the Lost Zone.',
    },
    {
      name: 'Cursed Drop',
      cost: [P, C],
      damage: 0,
      text: 'Put 4 damage counters on your opponent\'s Pokémon in any way you like.',
    },
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '94';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Gengar';
  public fullName: string = 'Gengar 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Hurl into Darkness
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      // Number of Psychic Energy attached to Gengar (the attacker is the Active Pokémon here).
      const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, player.active);
      state = store.reduceEffect(state, checkProvidedEnergy);

      let psychicEnergy = 0;
      checkProvidedEnergy.energyMap.forEach(energy => {
        if (energy.provides.includes(CardType.PSYCHIC)) {
          psychicEnergy += 1;
        }
      });

      const pokemonInHand = opponent.hand.cards
        .filter(card => card.superType === SuperType.POKEMON).length;
      const max = Math.min(psychicEnergy, pokemonInHand);

      if (max > 0) {
        state = store.prompt(state, new ChooseCardsPrompt(
          player,
          GameMessage.CHOOSE_CARD_TO_DECK,
          opponent.hand,
          { superType: SuperType.POKEMON },
          { min: 0, max },
        ), cards => {
          if (cards !== undefined && cards.length > 0) {
            state = MOVE_CARDS(store, state, opponent.hand, opponent.lostzone, { cards });
          }
        }) ?? state;
      }
    }

    // Cursed Drop
    if (WAS_ATTACK_USED(effect, 1, this)) {
      PUT_X_DAMAGE_COUNTERS_IN_ANY_WAY_YOU_LIKE(4, store, state, effect);
    }

    return state;
  }
}
