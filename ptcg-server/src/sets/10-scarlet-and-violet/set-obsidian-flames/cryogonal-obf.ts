import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED } from '../../../game/store/prefabs/attack-effects';

export class Cryogonal extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 90;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [{
    name: 'First Freeze',
    cost: [C],
    damage: 30,
    text: 'If you go second and it\'s your first turn, your opponent\'s Active Pokémon is now Paralyzed.',
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '55';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Cryogonal';
  public fullName: string = 'Cryogonal OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      // "If you go second and it's your first turn": the second player's first turn is game turn 2.
      if (state.turn === 2) {
        YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED(store, state, effect);
      }
    }
    return state;
  }
}
