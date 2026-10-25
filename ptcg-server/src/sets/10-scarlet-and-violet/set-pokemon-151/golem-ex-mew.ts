import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { NEXT_TURN_ATTACK_BONUS_ALL_ATTACKS } from '../../../game/store/prefabs/attack-effects';

export class Golemex extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Graveler';
  public cardType: CardType[] = [F];
  public hp: number = 330;
  public weakness = [{ type: G }];
  public retreat = [C, C, C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Dynamic Roll',
      cost: [F],
      damage: 50,
      text: 'During your next turn, attacks used by this Pokémon do 120 more damage to your opponent\'s Active Pokémon (before applying Weakness and Resistance).',
    },
    {
      name: 'Rock Blaster',
      cost: [F, C, C],
      damage: 180,
      text: 'This attack\'s damage isn\'t affected by Resistance.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '76';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Golem ex';
  public fullName: string = 'Golem ex MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Dynamic Roll: arms a "during your next turn, this Pokemon's attacks do +120 damage"
    // marker on the turn it is used, and applies the bonus to later damage effects.
    NEXT_TURN_ATTACK_BONUS_ALL_ATTACKS(effect, {
      source: this,
      bonusDamage: 120,
      setupAttack: this.attacks[0],
    });

    // Rock Blaster: damage is not affected by Resistance.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      effect.ignoreResistance = true;
    }

    return state;
  }
}
