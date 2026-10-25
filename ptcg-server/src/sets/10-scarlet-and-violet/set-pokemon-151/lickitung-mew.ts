import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_CANNOT_ATTACK } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Lickitung extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 100;
  public weakness = [{ type: F }];
  public retreat = [C, C, C, C];

  public attacks = [{
    name: 'Tongue-Tied',
    cost: [C, C, C],
    damage: 70,
    text: 'During your opponent\'s next turn, the Defending Pokémon can\'t attack.',
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '108';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lickitung';
  public fullName: string = 'Lickitung MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DEFENDING_POKEMON_CANNOT_ATTACK(store, state, effect, this);
    }
    return state;
  }
}
