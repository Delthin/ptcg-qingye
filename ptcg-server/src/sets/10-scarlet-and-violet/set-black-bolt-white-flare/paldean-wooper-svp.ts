import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ADD_POISON_TO_PLAYER_ACTIVE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class PaldeanWooper extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 60;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Splattering Poison',
      cost: [D],
      damage: 0,
      text: 'Both Active Pokémon are now Poisoned.',
    },
    {
      name: 'Tail Whap',
      cost: [D, C, C],
      damage: 30,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVP';
  public setNumber: string = '41';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Paldean Wooper';
  public fullName: string = 'Paldean Wooper SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      ADD_POISON_TO_PLAYER_ACTIVE(store, state, player, this);
      ADD_POISON_TO_PLAYER_ACTIVE(store, state, opponent, this);
    }
    return state;
  }
}
