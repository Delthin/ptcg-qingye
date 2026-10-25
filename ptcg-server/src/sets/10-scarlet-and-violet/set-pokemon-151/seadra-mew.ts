import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_FLIPS_COIN_TO_ATTACK } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Seadra extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Horsea';
  public cardType: CardType[] = [W];
  public hp: number = 80;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [{
    name: 'Blinding Ink',
    cost: [W, C, C],
    damage: 50,
    text: 'During your opponent\'s next turn, if the Defending Pokémon tries to use an attack, your opponent flips 2 coins. If either of them is tails, that attack doesn\'t happen.',
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '117';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Seadra';
  public fullName: string = 'Seadra MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DEFENDING_POKEMON_FLIPS_COIN_TO_ATTACK(store, state, effect, this, 2);
    }
    return state;
  }
}
