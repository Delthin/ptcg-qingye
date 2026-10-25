import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { GameMessage, PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HealEffect } from '../../../game/store/effects/game-effects';
import { ChoosePokemonPrompt } from '../../../game/store/prompts/choose-pokemon-prompt';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class ScreamTail extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 90;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  protected _tags = [CardTag.ANCIENT];

  public attacks = [
    {
      name: 'Supportive Singing',
      cost: [C],
      damage: 0,
      text: 'Heal 100 damage from 1 of your Benched Ancient Pokémon.'
    },
    {
      name: 'Hyper Voice',
      cost: [C, C],
      damage: 40,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '77';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Scream Tail';
  public fullName: string = 'Scream Tail TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const ancientBench = player.bench.filter(slot => {
        const pokemon = slot.getPokemonCard();
        return slot.cards.length > 0 && pokemon !== undefined && pokemon.tags.includes(CardTag.ANCIENT);
      });

      if (ancientBench.length === 0) {
        return state;
      }

      const blocked = player.bench
        .map((slot, index) => ({ slot, index }))
        .filter(entry => !ancientBench.includes(entry.slot))
        .map(entry => ({ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: entry.index }));

      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_HEAL,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { min: 1, max: 1, allowCancel: false, blocked: blocked },
      ), targets => {
        const target = targets[0];
        if (target === undefined) {
          return;
        }
        const healEffect = new HealEffect(player, target, 100);
        store.reduceEffect(state, healEffect);
      }) ?? state;
    }

    return state;
  }
}
