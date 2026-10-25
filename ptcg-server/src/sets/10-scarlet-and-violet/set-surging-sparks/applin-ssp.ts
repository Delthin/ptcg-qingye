import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { ChoosePokemonPrompt, GameMessage, PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HealEffect } from '../../../game/store/effects/game-effects';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE } from '../../../game/store/prefabs/attack-effects';

export class Applin extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [N];
  public hp: number = 40;
  public retreat = [C];

  public attacks = [
    {
      name: 'Nutrients',
      cost: [C],
      damage: 0,
      text: 'Heal 30 damage from 1 of your Pokémon.'
    },
    {
      name: 'Trip Over',
      cost: [G, R],
      damage: 20,
      damageCalculation: '+',
      text: 'Flip a coin. If heads, this attack does 30 more damage.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '138';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Applin';
  public fullName: string = 'Applin SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      let hasDamagedPokemon = false;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        if (cardList.damage > 0) {
          hasDamagedPokemon = true;
        }
      });

      if (hasDamagedPokemon) {
        state = store.prompt(state, new ChoosePokemonPrompt(
          player.id,
          GameMessage.CHOOSE_POKEMON_TO_HEAL,
          PlayerType.BOTTOM_PLAYER,
          [SlotType.ACTIVE, SlotType.BENCH],
          { allowCancel: false, min: 1, max: 1 }
        ), targets => {
          if (targets.length === 0) {
            return;
          }
          const healEffect = new HealEffect(player, targets[0], 30);
          store.reduceEffect(state, healEffect);
        });
      }
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE(store, state, effect, 30);
    }

    return state;
  }
}
