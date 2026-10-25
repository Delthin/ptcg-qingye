import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_FLIPS_COIN_TO_ATTACK } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Quaxly extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 60;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [{
    name: 'Apply Gel',
    cost: [W, C],
    damage: 20,
    text: 'During your opponent\'s next turn, if the Defending Pokémon tries to attack, your opponent flips a coin. If tails, that attack doesn\'t happen.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '49';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Quaxly';
  public fullName: string = 'Quaxly PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DEFENDING_POKEMON_FLIPS_COIN_TO_ATTACK(store, state, effect, this);
    }
    return state;
  }
}
