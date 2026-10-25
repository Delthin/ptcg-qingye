import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_DEFENDING_POKEMON_AT_END_OF_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/attack-effects';

export class TeamRocketsGrimer extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 80;
  public weakness = [{ type: F }];
  public retreat = [C, C, C];

  public attacks = [{
    name: 'Corrosive Sludge',
    cost: [D, C],
    damage: 0,
    text: 'At the end of your opponent\'s next turn, discard the Defending Pokémon and all attached cards.',
  }];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '123';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Team Rocket\'s Grimer';
  public fullName: string = 'Team Rocket\'s Grimer DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DISCARD_DEFENDING_POKEMON_AT_END_OF_OPPONENTS_NEXT_TURN(store, state, effect, this);
    }

    return state;
  }
}
