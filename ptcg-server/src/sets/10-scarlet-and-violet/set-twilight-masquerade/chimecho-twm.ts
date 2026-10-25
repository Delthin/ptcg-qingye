import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { GameMessage, PlayerType, SlotType, State, StoreLike } from '../../../game';
import { ChoosePokemonPrompt } from '../../../game/store/prompts/choose-pokemon-prompt';
import { Effect } from '../../../game/store/effects/effect';
import { MOVE_CARDS, SHUFFLE_DECK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Chimecho extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 70;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Hyper Voice',
      cost: [P],
      damage: 20,
      text: '',
    },
    {
      name: 'Homeward Chime',
      cost: [C, C],
      damage: 0,
      text: 'Shuffle 1 of your Benched Pokémon and all attached cards into your deck.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '85';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Chimecho';
  public fullName: string = 'Chimecho TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const benched = player.bench.filter(b => b.cards.length > 0);

      if (benched.length === 0) {
        return state;
      }

      state = store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_PICK_UP,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { min: 1, max: 1, allowCancel: false },
      ), selection => {
        const targets = selection ?? [];
        if (targets.length === 0) {
          return;
        }

        const target = targets[0];
        MOVE_CARDS(store, state, target, player.deck);
        SHUFFLE_DECK(store, state, player);
      }) ?? state;

      return state;
    }

    return state;
  }
}
