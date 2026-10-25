import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { GameMessage, PlayerType, SlotType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChoosePokemonPrompt } from '../../../game/store/prompts/choose-pokemon-prompt';
import { COIN_FLIP_PROMPT, MOVE_CARDS, SHUFFLE_DECK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED } from '../../../game/store/prefabs/attack-effects';

export class Sylveon extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Eevee';
  public cardType: CardType[] = [P];
  public hp: number = 120;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Mystical Return',
      cost: [P],
      damage: 0,
      text: 'Flip a coin. If heads, choose 1 of your opponent\'s Benched Pokémon. Shuffle that Pokémon and all attached cards into their deck.',
    },
    {
      name: 'Disarming Voice',
      cost: [P, C, C],
      damage: 90,
      text: 'Your opponent\'s Active Pokémon is now Confused.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SFA';
  public setNumber: string = '22';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Sylveon';
  public fullName: string = 'Sylveon SFA';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }

        if (opponent.bench.every(bench => bench.cards.length === 0)) {
          return;
        }

        state = store.prompt(state, new ChoosePokemonPrompt(
          player.id,
          GameMessage.CHOOSE_CARD_TO_DECK,
          PlayerType.TOP_PLAYER,
          [SlotType.BENCH],
          { allowCancel: false }
        ), targets => {
          if (targets.length === 0) {
            return;
          }

          const target = targets[0];
          state = MOVE_CARDS(store, state, target, opponent.deck, { cards: target.cards.slice() });
          state = SHUFFLE_DECK(store, state, opponent);
        }) ?? state;
      });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
    }

    return state;
  }
}
