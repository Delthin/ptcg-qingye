import { moveDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { MoveDamagePrompt } from '../../../game/store/prompts/move-damage-prompt';
import { CardTarget } from '../../../game/store/actions/play-card-action';
import { StateUtils } from '../../../game/store/state-utils';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State, GameMessage, PlayerType, SlotType } from '../../../game';

import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Yamask extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 50;
  public weakness = [{ type: D }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Transfer Pain',
      cost: [P],
      damage: 0,
      text: 'Move 1 damage counter from any of your Pokémon to any of your opponent\'s Pokémon.'
    }
  ];

  public set: string = 'PLF';
  public setNumber: string = '54';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Yamask';
  public fullName: string = 'Yamask PLF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Attack 1: Transfer Pain
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const blockedFrom: CardTarget[] = [], blockedTo: CardTarget[] = [];
      let hasSource = false;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (list, _card, target) => {
        blockedTo.push(target);
        if (list.damage >= 10) hasSource = true;
      });
      effect.opponent.forEachPokemon(PlayerType.TOP_PLAYER, (_list, _card, target) => blockedFrom.push(target));
      if (!hasSource) return state;
      return store.prompt(state, new MoveDamagePrompt(player.id, GameMessage.MOVE_DAMAGE,
        PlayerType.ANY, [SlotType.ACTIVE, SlotType.BENCH], [], {
          min: 1, max: 1, allowCancel: false, blockedFrom, blockedTo,
          singleSourceTarget: true, singleDestinationTarget: true
        }), transfers => {
          for (const transfer of transfers || []) {
            state = moveDamageCounters(store, state, player,
              StateUtils.getTarget(state, player, transfer.from),
              StateUtils.getTarget(state, player, transfer.to), 10, effect);
          }
        });
    }

    return state;
  }
}
