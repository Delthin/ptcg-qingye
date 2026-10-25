import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN } from '../../../game/store/prefabs/prefabs';
import { OPPONENTS_POKEMON_CANNOT_USE_THAT_ATTACK } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Pangoro extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Pancham';
  public cardType: CardType[] = [D];
  public hp: number = 140;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Torment',
      cost: [D],
      damage: 30,
      text: 'Choose 1 of your opponent\'s Active Pokémon\'s attacks. During your opponent\'s next turn, that Pokémon can\'t use that attack.'
    },
    {
      name: 'Power Tackle',
      cost: [D, D, C],
      damage: 160,
      text: 'During your next turn, this Pokémon can\'t attack.'
    }
  ];

  public regulationMark = 'I';
  public set: string = 'JTG';
  public setNumber: string = '99';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pangoro';
  public fullName: string = 'Pangoro JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = OPPONENTS_POKEMON_CANNOT_USE_THAT_ATTACK(store, state, effect, this);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN(effect.player);
    }

    return state;
  }
}
