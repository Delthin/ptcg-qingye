import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_BURN_TO_PLAYER_ACTIVE,
  COIN_FLIP_PROMPT,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Vulpix extends PokemonCard {

  public regulationMark: string = 'G';

  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.FIRE];
  public hp: number = 70;
  public weakness = [{ type: CardType.WATER }];
  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Super Singe',
      cost: [CardType.FIRE, CardType.COLORLESS],
      damage: 20,
      text: 'Flip a coin. If heads, your opponent\'s Active Pokémon is now Burned.',
    },
  ];

  public set: string = 'MEW';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '37';
  public name: string = 'Vulpix';
  public fullName: string = 'Vulpix MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Attack 1: Super Singe
    // Ref: set-dragons-majesty/torchic.ts (coin flip + Burned)
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      return COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          ADD_BURN_TO_PLAYER_ACTIVE(store, state, opponent, this);
        }
      });
    }

    return state;
  }

}
