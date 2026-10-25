import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { GameMessage, PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HealEffect } from '../../../game/store/effects/game-effects';
import { ChoosePokemonPrompt } from '../../../game/store/prompts/choose-pokemon-prompt';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Arboliva extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Dolliv';
  public cardType: CardType[] = [G];
  public hp: number = 140;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Healing Fruit',
      cost: [G],
      damage: 0,
      text: 'Heal all damage from 1 of your Benched Pokémon.',
    },
    {
      name: 'Oil Shot',
      cost: [G],
      damage: 90,
      text: '',
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '21';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Arboliva';
  public fullName: string = 'Arboliva OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Healing Fruit: Heal all damage from 1 of your Benched Pokemon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const hasBenched = player.bench.some(benchSlot => benchSlot.cards.length > 0);
      if (!hasBenched) {
        return state;
      }

      state = store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_HEAL,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { min: 1, max: 1, allowCancel: false },
      ), targets => {
        if (!targets || targets.length === 0) {
          return;
        }

        const target = targets[0];
        if (target.damage > 0) {
          const healEffect = new HealEffect(player, target, target.damage);
          store.reduceEffect(state, healEffect);
        }
      }) ?? state;
    }

    return state;
  }
}
