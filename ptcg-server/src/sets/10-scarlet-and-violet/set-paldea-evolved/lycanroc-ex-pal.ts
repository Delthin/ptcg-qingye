import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { THIS_POKEMON_RETALIATES_ON_DAMAGE_DURING_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Lycanrocex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Rockruff';
  public cardType: CardType[] = [CardType.FIGHTING];
  public hp: number = 260;
  public weakness = [{ type: CardType.GRASS }];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Rock Throw',
      cost: [CardType.FIGHTING],
      damage: 40,
      text: '',
    },
    {
      name: 'Scary Fangs',
      cost: [CardType.FIGHTING, CardType.COLORLESS, CardType.COLORLESS],
      damage: 140,
      text: 'During your opponent\'s next turn, if this Pokémon is damaged by an attack (even if it is Knocked Out), put 10 damage counters on the Attacking Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '117';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lycanroc ex';
  public fullName: string = 'Lycanroc ex PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      // Scary Fangs: during your opponent's next turn, if this Pokémon is damaged by an
      // attack (even if it is Knocked Out), put 10 damage counters on the Attacking Pokémon.
      const retaliateOptions = {
        marker: 'scary-fangs',
        damageCounters: 10,
        counters: 10,
        damage: 100,
      };
      state = THIS_POKEMON_RETALIATES_ON_DAMAGE_DURING_OPPONENTS_NEXT_TURN(
        store, state, effect, this,
        retaliateOptions as never,
      );
    }
    return state;
  }
}
