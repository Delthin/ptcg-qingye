import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  SWITCH_ACTIVE_WITH_BENCHED,
  THIS_POKEMON_DOES_DAMAGE_TO_ITSELF,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Noivernex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Noibat';
  public cardType: CardType[] = [C];
  public hp: number = 270;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Strafe',
      cost: [C],
      damage: 50,
      text: 'You may switch this Pokémon with 1 of your Benched Pokémon.'
    },
    {
      name: 'Sonic Blast',
      cost: [C, C, C],
      damage: 220,
      text: 'This Pokémon also does 30 damage to itself.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '91';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Noivern ex';
  public fullName: string = 'Noivern ex PRE';
  public rules = [
    'Pokémon ex rule: When your Pokémon ex is Knocked Out, your opponent takes 2 Prize cards.'
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = SWITCH_ACTIVE_WITH_BENCHED(store, state, effect.player) ?? state;
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 30);
    }

    return state;
  }
}
