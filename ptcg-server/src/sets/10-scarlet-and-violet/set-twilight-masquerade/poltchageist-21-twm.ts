import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType, EnergyType } from '../../../game/store/card/card-types';
import { GameMessage, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import { COIN_FLIP_PROMPT, MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Poltchageist2 extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 40;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Tea Server',
      cost: [G],
      damage: 0,
      text: 'Put a Basic Grass Energy card from your discard pile into your hand.'
    },
    {
      name: 'Surprise Attack',
      cost: [G],
      damage: 30,
      text: 'Flip a coin. If tails, this attack does nothing.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '21';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Poltchageist';
  public fullName: string = 'Poltchageist TWM 21';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const basicGrassEnergy = player.discard.cards.filter(card =>
        card instanceof EnergyCard
        && card.energyType === EnergyType.BASIC
        && card.provides.includes(CardType.GRASS)
      );

      if (basicGrassEnergy.length === 0) {
        return state;
      }

      state = store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_HAND,
        player.discard,
        { superType: SuperType.ENERGY },
        { min: 1, max: 1, allowCancel: false }
      ), cards => {
        const selected = cards || [];
        if (selected.length === 0) {
          return;
        }
        state = MOVE_CARDS(store, state, player.discard, player.hand, { cards: selected });
      }) ?? state;
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = COIN_FLIP_PROMPT(store, state, effect.player, result => {
        if (!result) {
          effect.damage = 0;
        }
      });
    }

    return state;
  }
}
