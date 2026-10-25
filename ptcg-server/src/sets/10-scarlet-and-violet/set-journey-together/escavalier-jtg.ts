import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN } from '../../../game/store/prefabs/prefabs';

export class Escavalier extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Karrablast';
  public cardType: CardType[] = [M];
  public hp: number = 120;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Pierce',
      cost: [C],
      damage: 20,
      text: '',
    },
    {
      name: 'Iron Buster',
      cost: [M, C],
      damage: 120,
      text: 'During your next turn, this Pokémon can\'t attack.',
    },
  ];

  public regulationMark = 'I';
  public set: string = 'JTG';
  public setNumber: string = '102';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Escavalier';
  public fullName: string = 'Escavalier JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Iron Buster: during your next turn, this Pokémon can't attack.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN(effect.player);
    }
    return state;
  }
}
