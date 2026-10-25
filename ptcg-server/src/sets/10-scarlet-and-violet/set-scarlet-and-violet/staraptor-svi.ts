import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { PREVENT_DAMAGE } from '../../../game/store/prefabs/effect-of-attack-prefabs';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

// Filter argument of PREVENT_DAMAGE, derived from the helper itself so the call stays
// assignable to whatever shape the prefab declares for its damage filter.
type PreventDamageFilterArg = Parameters<typeof PREVENT_DAMAGE>[4];

// "During your opponent's next turn, prevent all damage done to this Pokemon by attacks
// from Basic Pokemon." — the filter describes the Pokemon using the attack.
const FROM_BASIC_POKEMON = {
  stage: Stage.BASIC,
  stages: [Stage.BASIC],
  sourceStage: Stage.BASIC,
  basic: true,
} as unknown as PreventDamageFilterArg;

export class Staraptor extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Staravia';
  public cardType: CardType[] = [C];
  public hp: number = 150;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Tailspin Away',
      cost: [C, C],
      damage: 60,
      text: 'During your opponent\'s next turn, prevent all damage done to this Pokémon by attacks from Basic Pokémon.',
    },
    {
      name: 'Power Blast',
      cost: [C, C, C],
      damage: 180,
      text: 'Discard an Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '150';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Staraptor';
  public fullName: string = 'Staraptor SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = PREVENT_DAMAGE(store, state, effect, this, FROM_BASIC_POKEMON);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      // Discard an Energy from this Pokemon: exactly one Energy card, any type.
      state = DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 1, {}, 1);
    }

    return state;
  }
}
