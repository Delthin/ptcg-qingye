import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import {
  DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON,
  YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED,
} from '../../../game/store/prefabs/attack-effects';

export class Stunfisk extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.LIGHTNING];
  public hp: number = 110;
  public weakness = [{ type: CardType.FIGHTING }];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [{
    name: 'Paralyzing Crackle',
    cost: [CardType.LIGHTNING, CardType.COLORLESS],
    damage: 50,
    text: 'Flip a coin. If heads, your opponent\'s Active Pokémon is now Paralyzed, and discard an Energy from that Pokémon.',
  }];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '64';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Stunfisk';
  public fullName: string = 'Stunfisk SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      return COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }

        YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED(store, state, effect);
        DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON(store, state, effect);
      });
    }

    return state;
  }
}
