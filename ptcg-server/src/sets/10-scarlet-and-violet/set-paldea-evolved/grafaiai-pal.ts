import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, EnergyType, Stage, SuperType } from '../../../game/store/card/card-types';
import { Card } from '../../../game/store/card/card';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { GameMessage, State, StoreLike } from '../../../game';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import { Effect } from '../../../game/store/effects/effect';
import { ADD_POISON_TO_PLAYER_ACTIVE, MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Grafaiai extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Shroodle';
  public cardType: CardType[] = [D];
  public hp: number = 90;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Spit Poison',
      cost: [D],
      damage: 0,
      text: 'Your opponent\'s Active Pokémon is now Poisoned.',
    },
    {
      name: 'Colorful Graffiti',
      cost: [D],
      damage: 40,
      damageCalculation: 'x',
      text: 'You may discard as many Basic Energy cards as you like from your hand. This attack does 40 damage for each type of Basic Energy you discarded in this way.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '146';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Grafaiai';
  public fullName: string = 'Grafaiai PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      ADD_POISON_TO_PLAYER_ACTIVE(store, state, effect.opponent, this);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const attackEffect = effect;
      const player = attackEffect.player;

      // The whole damage comes from the Energy types discarded, so start at 0.
      attackEffect.damage = 0;

      const basicEnergyInHand = player.hand.cards.filter(
        (card): card is EnergyCard => card instanceof EnergyCard && card.energyType === EnergyType.BASIC,
      );

      if (basicEnergyInHand.length === 0) {
        return state;
      }

      state = store.prompt(
        state,
        new ChooseCardsPrompt(
          player,
          GameMessage.CHOOSE_CARD_TO_DISCARD,
          player.hand,
          { superType: SuperType.ENERGY },
          { min: 0, max: basicEnergyInHand.length, allowCancel: false },
        ),
        (chosen: Card[]) => {
          const discarded = chosen.filter(
            (card): card is EnergyCard => card instanceof EnergyCard && card.energyType === EnergyType.BASIC,
          );

          if (discarded.length > 0) {
            state = MOVE_CARDS(store, state, player.hand, player.discard, {
              cards: discarded,
              sourceCard: this,
            });
          }

          const discardedTypes = new Set<CardType>();

          discarded.forEach(card => {
            card.provides.forEach((provided: CardType) => {
              discardedTypes.add(provided);
            });
          });

          attackEffect.damage = 40 * discardedTypes.size;
        },
      ) ?? state;
    }

    return state;
  }
}
