import {
  AttachEnergyPrompt,
  CardList,
  CardTag,
  CardType,
  EnergyCard,
  GameMessage,
  PlayerType,
  PokemonCard,
  ShowCardsPrompt,
  SlotType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
} from '../../../game';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { Effect } from '../../../game/store/effects/effect';
import { AttachEnergyEffect } from '../../../game/store/effects/play-card-effects';
import { attachEnergyFromEffect } from '../../../game/store/prefabs/attach-energy-from-effect';

import { SHUFFLE_DECK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Laprasex extends PokemonCard {
  public cardType: CardType[] = [CardType.WATER];

  protected _tags = [CardTag.POKEMON_ex, CardTag.POKEMON_TERA];

  public hp = 220;

  public stage = Stage.BASIC;

  public weakness = [{ type: CardType.METAL }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Power Splash',
      cost: [CardType.WATER],
      damage: 40,
      damageCalculation: 'x',
      text: 'This attack does 40 damage for each Energy attached to this Pokémon.',
    },
    {
      name: 'Larimar Rain',
      cost: [CardType.WATER, CardType.PSYCHIC, CardType.METAL],
      damage: 0,
      text: 'Look at the top 20 cards of your deck and attach any number of Energy cards you find there to your Pokémon in any way you like. Shuffle the other cards back into your deck.',
    },
  ];

  public regulationMark = 'H';

  public set: string = 'SCR';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '32';

  public name: string = 'Lapras ex';

  public fullName: string = 'Lapras ex SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, effect.source);
      store.reduceEffect(state, checkProvidedEnergy);
      effect.damage = checkProvidedEnergy.energyMap.reduce((total, entry) =>
        total + StateUtils.getEnergyUnits(entry).length, 0) * 40;

      return state;
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const temp = new CardList();
      player.deck.moveTo(temp, Math.min(20, player.deck.cards.length));
      const finish = () => {
        temp.moveTo(player.deck);
        SHUFFLE_DECK(store, state, player);
      };
      // Check if any cards drawn are basic energy
      const energyCardsDrawn = temp.cards.filter((card) => {
        return card instanceof EnergyCard;
      });

      // If no energy cards were drawn, move all cards to deck & shuffle
      if (energyCardsDrawn.length == 0) {
        return store.prompt(
          state,
          [new ShowCardsPrompt(player.id, GameMessage.CARDS_SHOWED_BY_EFFECT, temp.cards)],
          finish,
        );
      }

      if (energyCardsDrawn.length >= 1) {
        // Prompt to attach energy if any were drawn
        return store.prompt(
          state,
          new AttachEnergyPrompt(
            player.id,
            GameMessage.ATTACH_ENERGY_CARDS,
            temp, // Only show drawn energies
            PlayerType.BOTTOM_PLAYER,
            [SlotType.BENCH, SlotType.ACTIVE],
            { superType: SuperType.ENERGY },
            { min: 0, max: energyCardsDrawn.length },
          ),
          (transfers) => {
            // Attach energy based on prompt selection
            if (transfers) {
              state = attachEnergyFromEffect(store, state, transfers.map(transfer =>
                new AttachEnergyEffect(player, transfer.card as EnergyCard,
                  StateUtils.getTarget(state, player, transfer.to), temp)));
            }
            finish();
          },
        );
      }
      return state;
    }

    if (
      effect instanceof PutDamageEffect &&
      effect.target.cards.includes(this) &&
      effect.target.getPokemonCard() === this
    ) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      // Target is not Active
      if (effect.target === player.active || effect.target === opponent.active) {
        return state;
      }

      effect.preventDefault = true;
    }
    return state;
  }
}
