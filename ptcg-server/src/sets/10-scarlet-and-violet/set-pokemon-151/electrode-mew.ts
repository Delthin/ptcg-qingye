import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { CardList, ChooseCardsPrompt, GameMessage, PlayerType, State, StoreLike } from '../../../game';

export class Electrode extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Voltorb';
  public cardType: CardType[] = [L];
  public hp: number = 90;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Bang Boom Chain',
      cost: [L],
      damage: 20,
      damageCalculation: '+',
      text: 'Before doing damage, you may discard any number of Pokémon Tools from your Pokémon. This attack does 40 more damage for each card you discarded in this way.',
    },
    {
      name: 'Electro Ball',
      cost: [L, C],
      damage: 70,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '101';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Electrode';
  public fullName: string = 'Electrode MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // Collect every Pokemon Tool attached to your Pokemon in play as a
      // temporary CardList, which is what ChooseCardsPrompt expects.
      const availableTools = new CardList();
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        cardList.tools.forEach(tool => {
          if (!availableTools.cards.includes(tool)) {
            availableTools.cards.push(tool);
          }
        });
      });

      if (availableTools.cards.length === 0) {
        return state;
      }

      state = store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_DISCARD,
        availableTools,
        {},
        { min: 0, max: availableTools.cards.length, allowCancel: false }
      ), selected => {
        if (!selected || selected.length === 0) {
          return;
        }

        selected.forEach(tool => {
          player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
            const index = cardList.tools.indexOf(tool);
            if (index !== -1) {
              cardList.tools.splice(index, 1);
              player.discard.cards.push(tool);
            }
          });
        });

        // 40 more damage for each Tool discarded this way.
        effect.damage += 40 * selected.length;
      });
    }

    return state;
  }
}
