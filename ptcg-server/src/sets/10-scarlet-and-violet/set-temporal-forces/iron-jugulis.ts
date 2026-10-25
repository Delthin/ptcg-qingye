import {
  CardTag,
  CardType,
  PokemonCard,
  PowerType,
  Stage,
  State,
  StoreLike,
} from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { putPokemonPowerDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { ON_DAMAGED_BY_OPPONENT_ATTACK_EVEN_IF_KNOCKED_OUT } from '../../../game/store/prefabs/prefabs';

export class IronJugulis extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public regulationMark = 'H';

  protected _tags = [CardTag.FUTURE];

  public cardType: CardType[] = [CardType.COLORLESS];

  public hp: number = 130;

  public weakness = [{ type: CardType.LIGHTNING }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Blasting Wind',
      cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
      damage: 110,
      text: '',
    },
  ];

  public powers = [
    {
      name: 'Automated Combat',
      powerType: PowerType.ABILITY,
      text: "If this Pokémon is damaged by an attack from your opponent's Pokémon(even if this Pokémon is Knocked Out), put 3 damage counters on the Attacking Pokémon.",
    },
  ];

  public set: string = 'TEF';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '139';

  public name: string = 'Iron Jugulis';

  public fullName: string = 'Iron Jugulis TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (ON_DAMAGED_BY_OPPONENT_ATTACK_EVEN_IF_KNOCKED_OUT(state, effect, { source: this, requireActiveSpot: false })) {
      return putPokemonPowerDamageCounters(store, state, this, effect.source, 30);
    }

    return state;
  }
}
