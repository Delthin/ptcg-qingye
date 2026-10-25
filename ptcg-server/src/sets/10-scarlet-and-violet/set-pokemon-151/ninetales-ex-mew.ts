import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State, StateUtils } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_BURN_TO_PLAYER_ACTIVE,
  AFTER_ATTACK,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Ninetalesex extends PokemonCard {
  public regulationMark = 'G';

  protected _tags = [CardTag.POKEMON_ex];

  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Vulpix';

  public cardType: CardType[] = [CardType.FIRE];

  public hp: number = 260;

  public weakness = [{ type: CardType.WATER }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Heat Wave',
      cost: [CardType.FIRE],
      damage: 30,
      text: 'Your opponent\'s Active Pokémon is now Burned.',
    },
    {
      name: 'Mirrored Flames',
      cost: [CardType.FIRE, CardType.COLORLESS],
      damage: 80,
      damageCalculation: '+',
      text: 'If you have the same number of cards in your hand as your opponent, this attack does 140 more damage.',
    },
  ];

  public set: string = 'MEW';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '38';

  public name: string = 'Ninetales ex';

  public fullName: string = 'Ninetales ex MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Attack 1: Heat Wave
    // Ref: set-battle-styles/sizzlipede.ts (burn via ADD_BURN_TO_PLAYER_ACTIVE)
    if (AFTER_ATTACK(effect, 0, this)) {
      ADD_BURN_TO_PLAYER_ACTIVE(store, state, effect.opponent, this);
    }

    // Attack 2: Mirrored Flames
    // Ref: set-breakthrough/glalie-ex.ts (same hand size damage bonus)
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      if (player.hand.cards.length === opponent.hand.cards.length) {
        effect.damage += 140;
      }
    }

    return state;
  }
}
