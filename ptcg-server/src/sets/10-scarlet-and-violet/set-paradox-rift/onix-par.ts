import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_COIN_TO_PREVENT_DAMAGE_AND_EFFECTS_DURING_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Onix extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardType: CardType[] = [F];

  public hp: number = 120;

  public weakness = [{ type: G }];

  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Hard Headbutt',
      cost: [C],
      damage: 20,
      text: 'Flip a coin. If heads, during your opponent\'s next turn, prevent all damage from and effects of attacks done to this Pokémon.',
    },
    {
      name: 'Land Crush',
      cost: [C, C, C],
      damage: 80,
      text: '',
    },
  ];

  public regulationMark = 'G';

  public set: string = 'PAR';

  public setNumber: string = '90';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Onix';

  public fullName: string = 'Onix PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = FLIP_COIN_TO_PREVENT_DAMAGE_AND_EFFECTS_DURING_OPPONENTS_NEXT_TURN(store, state, effect, this);
    }

    return state;
  }
}
