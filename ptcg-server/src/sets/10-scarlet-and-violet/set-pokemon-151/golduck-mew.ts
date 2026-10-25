import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Golduck extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Psyduck';
  public cardType: CardType[] = [W];
  public hp: number = 110;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Aquatic Rescue',
      cost: [C],
      damage: 0,
      text: 'Put up to 4 Pokémon from your discard pile into your hand.',
    },
    {
      name: 'Super Splash',
      cost: [W, W, C],
      damage: 120,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '55';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Golduck';
  public fullName: string = 'Golduck MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND(
        store, state, player, this,
        { superType: SuperType.POKEMON },
        { min: 0, max: 4 },
      );
    }

    return state;
  }
}
