import { moveDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { MoveDamagePrompt } from '../../../game/store/prompts/move-damage-prompt';
import { CardTarget } from '../../../game/store/actions/play-card-action';
import { StateUtils } from '../../../game/store/state-utils';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SpecialCondition } from '../../../game/store/card/card-types';
import { StoreLike, State, PlayerType, SlotType, GameMessage } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { AddSpecialConditionsEffect } from '../../../game/store/effects/attack-effects';

export class Cofagrigus extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Yamask';
  public cardType: CardType[] = [P];
  public hp: number = 90;
  public weakness = [{ type: D }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Damagriiigus',
      cost: [P],
      damage: 0,
      text: 'Move up to 3 damage counters from 1 of your Pokémon to 1 of your opponent\'s Pokémon.'
    },
    {
      name: 'Perplex',
      cost: [P, C, C],
      damage: 30,
      text: 'The Defending Pokémon is now Confused.'
    }
  ];

  public set: string = 'NVI';
  public setNumber: string = '46';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Cofagrigus';
  public fullName: string = 'Cofagrigus NVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Damagriiigus - move up to 3 damage counters from your Pokémon to opponent's
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
          min: 0, max: 3, allowCancel: false, blockedFrom, blockedTo,
          singleSourceTarget: true, singleDestinationTarget: true
        }), transfers => {
          for (const transfer of transfers || []) {
            state = moveDamageCounters(store, state, player,
              StateUtils.getTarget(state, player, transfer.from),
              StateUtils.getTarget(state, player, transfer.to), 10, effect);
          }
        });
    }

    // Perplex
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const addSpecialCondition = new AddSpecialConditionsEffect(effect, [SpecialCondition.CONFUSED]);
      store.reduceEffect(state, addSpecialCondition);
    }

    return state;
  }
}
