import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage, SuperType } from '../../../game/store/card/card-types';
import { ChooseCardsPrompt, GameMessage, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Landorus extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 130;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Fist of Focus',
      cost: [F],
      damage: 30,
      text: 'Attach an Energy card from your discard pile to this Pokémon.',
    },
    {
      name: 'Buster Swing',
      cost: [F, C, C, C],
      damage: 130,
      text: 'This attack\'s damage isn\'t affected by Resistance.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '110';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Landorus';
  public fullName: string = 'Landorus SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Fist of Focus: attach an Energy card from your discard pile to this Pokémon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const target = player.active;

      const hasEnergyInDiscard = player.discard.cards.some(card => card.superType === SuperType.ENERGY);
      if (!hasEnergyInDiscard) {
        return state;
      }

      state = store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_ATTACH,
        player.discard,
        { superType: SuperType.ENERGY },
        { min: 1, max: 1, allowCancel: false },
      ), cards => {
        state = MOVE_CARDS(store, state, player.discard, target, { cards });
      }) ?? state;
    }

    // Buster Swing: this attack's damage isn't affected by Resistance.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      effect.ignoreResistance = true;
    }

    return state;
  }
}
