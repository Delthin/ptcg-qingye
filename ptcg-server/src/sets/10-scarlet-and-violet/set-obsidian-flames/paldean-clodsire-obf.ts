import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SpecialCondition } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_POISON_TO_PLAYER_ACTIVE,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class PaldeanClodsire extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Paldean Wooper';
  public cardType: CardType[] = [D];
  public hp: number = 140;
  public weakness = [{ type: F }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Splattering Poison',
      cost: [D],
      damage: 0,
      text: 'Both Active Pokémon are now Poisoned.',
    },
    {
      name: 'Venoshock',
      cost: [D, C, C],
      damage: 80,
      damageCalculation: '+',
      text: 'If your opponent\'s Active Pokémon is Poisoned, this attack does 120 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '129';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Paldean Clodsire';
  public fullName: string = 'Paldean Clodsire OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Splattering Poison: both Active Pokémon are now Poisoned.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      ADD_POISON_TO_PLAYER_ACTIVE(store, state, effect.player, this);
      ADD_POISON_TO_PLAYER_ACTIVE(store, state, effect.opponent, this);
    }

    // Venoshock: +120 damage if the opponent's Active Pokémon is Poisoned.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const opponentActive = effect.opponent.active;

      if (opponentActive.specialConditions.includes(SpecialCondition.POISONED)) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 120);
      }
    }

    return state;
  }
}
