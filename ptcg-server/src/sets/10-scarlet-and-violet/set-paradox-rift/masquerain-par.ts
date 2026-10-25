import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType } from '../../../game/store/card/card-types';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { GameMessage, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import {
  FLIP_UNTIL_TAILS_AND_COUNT_HEADS,
  SHUFFLE_CARDS_INTO_DECK,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Masquerain extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Surskit';
  public cardType: CardType[] = [G];
  public hp: number = 100;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Daunting Eyes',
      cost: [G],
      damage: 0,
      text: 'Flip a coin until you get tails. For each heads, shuffle an Energy attached to your opponent\'s Active Pokémon into their deck.',
    },
    {
      name: 'Cutting Wind',
      cost: [G, C],
      damage: 70,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '2';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Masquerain';
  public fullName: string = 'Masquerain PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      // "For each heads" — resolve the picks one Energy at a time, since the
      // card prompt selects a single card per resolution by default.
      const shuffleEnergyForEachHead = (remaining: number): void => {
        if (remaining <= 0) {
          return;
        }

        const attachedEnergy = opponent.active.cards.filter(
          card => card instanceof EnergyCard,
        );

        if (attachedEnergy.length === 0) {
          return;
        }

        state = store.prompt(state, new ChooseCardsPrompt(
          player,
          GameMessage.CHOOSE_CARD_TO_DECK,
          opponent.active,
          { superType: SuperType.ENERGY },
        ), cards => {
          if (!cards || cards.length === 0) {
            return;
          }

          const chosenEnergy = cards
            .filter(card => card instanceof EnergyCard)
            .slice(0, remaining);

          if (chosenEnergy.length === 0) {
            return;
          }

          SHUFFLE_CARDS_INTO_DECK(store, state, opponent, chosenEnergy);
          shuffleEnergyForEachHead(remaining - chosenEnergy.length);
        }) ?? state;
      };

      state = FLIP_UNTIL_TAILS_AND_COUNT_HEADS(store, state, player, heads => {
        shuffleEnergyForEachHead(heads);
      });
    }

    return state;
  }
}
