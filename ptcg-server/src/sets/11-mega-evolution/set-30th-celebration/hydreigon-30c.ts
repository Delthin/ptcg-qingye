import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Hydreigon extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom: string = 'Zweilous';
  public cardType: CardType[] = [D];
  public hp: number = 170;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Triple Bite',
    cost: [D],
    damage: 0,
    text: 'Flip 3 coins. For each heads, discard an Energy from your opponent\'s Active Pokémon.'
  }, {
    name: 'Pitch-Black Fangs',
    cost: [D, C],
    damage: 140,
    text: ''
  }];

  public regulationMark: string = 'J';
  public set: string = '30C';
  public setNumber: string = '023/040';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Hydreigon';
  public fullName: string = 'Hydreigon 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      // Like Seaking SSH's Ripping Horn, but select all required cards in one
      // prompt so deferred resolutions cannot select the same Energy twice.
      return MULTIPLE_COIN_FLIPS_PROMPT(store, state, effect.player, 3, results => {
        const heads = results.filter(result => result).length;
        DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON(store, state, effect, undefined, heads);
      });
    }
    return state;
  }
}
