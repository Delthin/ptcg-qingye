import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType } from '../../../game/store/card/card-types';
import { ChooseCardsPrompt, ChoosePokemonPrompt, GameMessage, PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Grafaiai extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Shroodle';
  public cardType: CardType[] = [D];
  public hp: number = 100;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Mischievous Painting',
      cost: [C],
      damage: 0,
      text: 'Attach up to 3 Energy cards from your opponent\'s discard pile to their Pokémon in any way you like.',
    },
    {
      name: 'Energized Graffiti',
      cost: [D, D],
      damage: 40,
      damageCalculation: 'x',
      text: 'This attack does 40 damage for each Energy attached to all of your opponent\'s Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '121';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Grafaiai';
  public fullName: string = 'Grafaiai SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Mischievous Painting: attach up to 3 Energy cards from the opponent's discard pile to their Pokemon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      const energyInDiscard = opponent.discard.cards
        .filter(card => card.superType === SuperType.ENERGY);

      if (energyInDiscard.length > 0) {
        state = store.prompt(state, new ChooseCardsPrompt(
          player,
          GameMessage.CHOOSE_CARD_TO_HAND,
          opponent.discard,
          { superType: SuperType.ENERGY },
          { min: 0, max: 3, allowCancel: false },
        ), chosenEnergy => {

          const attachEnergyToOpponent = (index: number): void => {
            if (index >= chosenEnergy.length) {
              return;
            }

            const energyCard = chosenEnergy[index];

            state = store.prompt(state, new ChoosePokemonPrompt(
              player.id,
              GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
              PlayerType.TOP_PLAYER,
              [SlotType.ACTIVE, SlotType.BENCH],
              { allowCancel: false, min: 1, max: 1 },
            ), targets => {
              if (targets.length > 0) {
                state = MOVE_CARDS(store, state, opponent.discard, targets[0], { cards: [energyCard] });
              }
              attachEnergyToOpponent(index + 1);
            }) ?? state;
          };

          attachEnergyToOpponent(0);
        }) ?? state;
      }
    }

    // Energized Graffiti: 40 damage for each Energy attached to all of the opponent's Pokemon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const opponent = effect.opponent;

      let energyCount = 0;

      const opponentPokemon = [opponent.active, ...opponent.bench]
        .filter(cardList => cardList.cards.length > 0);

      opponentPokemon.forEach(cardList => {
        const checkProvidedEnergy = new CheckProvidedEnergyEffect(opponent, cardList);
        state = store.reduceEffect(state, checkProvidedEnergy);
        energyCount += checkProvidedEnergy.energyMap.length;
      });

      effect.damage = 40 * energyCount;
    }

    return state;
  }
}
