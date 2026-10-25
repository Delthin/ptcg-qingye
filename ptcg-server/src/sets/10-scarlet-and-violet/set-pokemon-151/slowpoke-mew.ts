import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HEAL_X_DAMAGE_FROM_THIS_POKEMON } from '../../../game/store/prefabs/attack-effects';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Slowpoke extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 80;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Sea Bathing',
      cost: [P],
      damage: 0,
      text: 'Heal 30 damage from this Pokémon, and it recovers from all Special Conditions.',
    },
    {
      name: 'Headbutt',
      cost: [C, C],
      damage: 20,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '79';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Slowpoke';
  public fullName: string = 'Slowpoke MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // Heal 30 damage from this Pokémon.
      HEAL_X_DAMAGE_FROM_THIS_POKEMON(30, effect, store, state);

      // It recovers from all Special Conditions.
      player.active.specialConditions = [];
    }

    return state;
  }
}
