import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage, SuperType } from '../../../game/store/card/card-types';
import { GameMessage, State, StoreLike, PlayerType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MOVE_CARDS, MOVE_DAMAGE_COUNTERS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';

export class DarkraiCresseliaLEGEND extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D, P];
  public hp: number = 150;
  public weakness = [{ type: F }, { type: P }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Lost Crisis',
      cost: [D, D, C, C],
      damage: 100,
      text: 'Choose 2 Energy attached to Darkrai & Cresselia LEGEND and put them in the Lost Zone. If any of your opponent\'s Pokémon would be Knocked Out by damage from this attack, put that Pokémon and all cards attached to it in the Lost Zone instead of discarding it.',
    },
    {
      name: 'Moon\'s Invite',
      cost: [P],
      damage: 0,
      text: 'Move as many damage counters on your opponent\'s Pokémon as you like to any of your opponent\'s other Pokémon in any way you like.',
    },
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '100';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Darkrai & Cresselia LEGEND';
  public fullName: string = 'Darkrai & Cresselia LEGEND 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Lost Crisis: choose 2 Energy attached to Darkrai & Cresselia LEGEND and put them in the Lost Zone.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const pokemon = player.active;
      const attachedEnergy = pokemon.cards.filter(card => card.superType === SuperType.ENERGY);

      if (attachedEnergy.length > 0) {
        const count = Math.min(2, attachedEnergy.length);
        const prompt = new ChooseCardsPrompt(
          player,
          GameMessage.CHOOSE_CARD_TO_DISCARD,
          pokemon,
          { superType: SuperType.ENERGY },
          { min: count, max: count, allowCancel: false },
        );

        state = store.prompt(state, prompt, (cards) => {
          if (!cards || cards.length === 0) {
            return;
          }
          MOVE_CARDS(store, state, pokemon, player.lostzone, { cards });
        }) ?? state;
      }
    }

    // Moon's Invite: move damage counters between your opponent's Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = MOVE_DAMAGE_COUNTERS(store, state, effect.player, {
        playerType: PlayerType.TOP_PLAYER, min: 0, origin: effect,
      });
    }

    return state;
  }
}
