import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { GameMessage, PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HealEffect } from '../../../game/store/effects/game-effects';
import { ChoosePokemonPrompt } from '../../../game/store/prompts/choose-pokemon-prompt';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class FlabB extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 40;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Bind Wound',
      cost: [C],
      damage: 0,
      text: 'Heal 30 damage from 1 of your Pokémon.',
    },
    {
      name: 'Fairy Wind',
      cost: [P],
      damage: 10,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '86';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Flabébé';
  public fullName: string = 'Flabébé TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_HEAL,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        { allowCancel: false },
      ), results => {
        const target = results[0];
        if (target !== undefined) {
          const healEffect = new HealEffect(player, target, 30);
          store.reduceEffect(state, healEffect);
        }
      }) ?? state;
    }

    return state;
  }
}
