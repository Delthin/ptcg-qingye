import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { TERA_RULE, THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Pikachuex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 190;
  public weakness = [{ type: F }];
  public retreat = [C];

  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Tail Whap',
      cost: [C],
      damage: 30,
      text: '',
    },
    {
      name: 'Thunder',
      cost: [L, L, C],
      damage: 220,
      text: 'This Pokémon also does 30 damage to itself.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '28';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pikachu ex';
  public fullName: string = 'Pikachu ex PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Rule: As long as this Pokémon is on your Bench, prevent all damage done
    // to this Pokémon by attacks (both yours and your opponent's). (Tera rule)
    if (effect instanceof PutDamageEffect && effect.target.cards.includes(this)) {
      TERA_RULE(effect, state, this);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 30);
    }

    return state;
  }
}
