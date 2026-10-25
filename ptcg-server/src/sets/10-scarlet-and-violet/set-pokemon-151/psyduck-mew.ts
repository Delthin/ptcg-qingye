import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ADD_MARKER, REMOVE_MARKER_AT_END_OF_TURN, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

const COIN_FLIPS_ARE_TAILS = 'COIN_FLIPS_ARE_TAILS';

export class Psyduck extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 70;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Overthink',
      cost: [C],
      damage: 0,
      text: 'During your opponent\'s next turn, whenever they flip a coin, treat it as tails.',
    },
    {
      name: 'Water Gun',
      cost: [W],
      damage: 10,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '54';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Psyduck';
  public fullName: string = 'Psyduck MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;
      ADD_MARKER(COIN_FLIPS_ARE_TAILS, opponent, this);
    }

    REMOVE_MARKER_AT_END_OF_TURN(effect, COIN_FLIPS_ARE_TAILS, this);

    return state;
  }
}
