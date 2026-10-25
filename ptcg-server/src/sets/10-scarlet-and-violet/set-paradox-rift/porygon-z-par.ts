import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType, EnergyType } from '../../../game/store/card/card-types';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { GameMessage, PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import {
  COIN_FLIP_PROMPT, IS_ABILITY_BLOCKED, USE_ABILITY_ONCE_PER_TURN, WAS_ATTACK_USED, WAS_POWER_USED,
} from '../../../game/store/prefabs/prefabs';

export class PorygonZ extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Porygon2';
  public cardType: CardType[] = [C];
  public hp: number = 150;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public powers = [{
    name: 'Buggy Turbo',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, you may flip a coin. If heads, attach up to 4 Basic Energy cards from your discard pile to this Pokémon. If tails, discard an Energy from this Pokémon.',
  }];

  public attacks = [{
    name: 'Energized Attack',
    cost: [C],
    damage: 40,
    damageCalculation: 'x',
    text: 'This attack does 40 damage for each Energy attached to this Pokémon.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '144';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Porygon-Z';
  public fullName: string = 'Porygon-Z PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Buggy Turbo
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      USE_ABILITY_ONCE_PER_TURN(player, 'BUGGY_TURBO', this);

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        const pokemon = player.active.getPokemonCard() === this
          ? player.active
          : player.bench.find(benchSlot => benchSlot.getPokemonCard() === this);

        if (pokemon === undefined) {
          return;
        }

        // Heads: attach up to 4 Basic Energy cards from your discard pile to this Pokémon.
        if (result) {
          const hasBasicEnergy = player.discard.cards.some(card =>
            card instanceof EnergyCard && card.energyType === EnergyType.BASIC);

          if (!hasBasicEnergy) {
            return;
          }

          state = store.prompt(state, new ChooseCardsPrompt(
            player,
            GameMessage.CHOOSE_ENERGY_FROM_DISCARD,
            player.discard,
            { superType: SuperType.ENERGY },
            { min: 0, max: 4, allowCancel: true }
          ), cards => {
            cards.forEach(card => {
              if (card instanceof EnergyCard && card.energyType === EnergyType.BASIC) {
                player.discard.moveCardTo(card, pokemon.energies);
              }
            });
          }) ?? state;

          return;
        }

        // Tails: discard an Energy from this Pokémon.
        if (pokemon.energies.cards.length === 0) {
          return;
        }

        state = store.prompt(state, new ChooseCardsPrompt(
          player,
          GameMessage.CHOOSE_CARD_TO_DISCARD,
          pokemon.energies,
          {},
          { min: 1, max: 1, allowCancel: false }
        ), cards => {
          if (cards.length === 0) {
            return;
          }
          pokemon.energies.moveCardTo(cards[0], player.discard);
        }) ?? state;
      });

      return state;
    }

    // Energized Attack
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const pokemon = player.active.getPokemonCard() === this
        ? player.active
        : player.bench.find(benchSlot => benchSlot.getPokemonCard() === this);

      if (pokemon === undefined) {
        return state;
      }

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, pokemon);
      state = store.reduceEffect(state, checkProvidedEnergy);

      effect.damage = 40 * checkProvidedEnergy.energyMap.length;
    }

    return state;
  }
}
