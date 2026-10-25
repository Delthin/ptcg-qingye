import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Tandemaus extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 40;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [{
    name: 'Tumble Over',
    cost: [C, C],
    damage: 40,
    text: 'During your next turn, this Pokémon can\'t attack.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '154';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tandemaus';
  public fullName: string = 'Tandemaus PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      // During your next turn, this Pokémon can't attack.
      THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN(effect.player);
    }
    return state;
  }
}
