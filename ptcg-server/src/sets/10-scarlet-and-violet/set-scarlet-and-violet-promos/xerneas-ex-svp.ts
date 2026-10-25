import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  WAS_ATTACK_USED,
  DEAL_MORE_DAMAGE_IF_OPPONENT_ACTIVE_HAS_CARD_TAG,
} from '../../../game/store/prefabs/prefabs';

export class XerneasEx extends PokemonCard {

  protected _tags = [CardTag.POKEMON_ex];

  public stage: Stage = Stage.BASIC;

  public cardType: CardType[] = [CardType.PSYCHIC];

  public hp: number = 210;

  public weakness = [{ type: CardType.METAL }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Aurora Beam',
      cost: [CardType.PSYCHIC, CardType.COLORLESS],
      damage: 50,
      text: '',
    },
    {
      name: 'Rising Horns',
      cost: [CardType.PSYCHIC, CardType.PSYCHIC, CardType.COLORLESS],
      damage: 120,
      damageCalculation: '+',
      text: "If your opponent's Active Pokémon is a Pokémon ex, this attack does 100 more damage.",
    },
  ];

  public regulationMark = 'H';

  public set: string = 'SVP';

  public setNumber: string = '179';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Xerneas ex';

  public fullName: string = 'Xerneas ex SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Attack 2: Rising Horns
    // Ref: set-roaring-skies/rayquaza-ex-2.ts (DEAL_MORE_DAMAGE_IF_OPPONENT_ACTIVE_HAS_CARD_TAG)
    if (WAS_ATTACK_USED(effect, 1, this)) {
      DEAL_MORE_DAMAGE_IF_OPPONENT_ACTIVE_HAS_CARD_TAG(effect, state, 100, CardTag.POKEMON_ex);
    }

    return state;
  }
}
