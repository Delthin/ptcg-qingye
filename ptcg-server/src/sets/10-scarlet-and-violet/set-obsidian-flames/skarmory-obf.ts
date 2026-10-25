import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_POKEMON_CANNOT_USE_THIS_ATTACK_NEXT_TURN, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Skarmory extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.METAL];
  public hp: number = 120;
  public weakness = [{ type: CardType.LIGHTNING }];
  public resistance = [{ type: CardType.FIGHTING, value: -30 }];
  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Peck',
      cost: [CardType.COLORLESS],
      damage: 20,
      text: '',
    },
    {
      name: 'Slashing Steel',
      cost: [CardType.METAL, CardType.METAL, CardType.COLORLESS],
      damage: 120,
      text: 'During your next turn, this Pokémon can\'t use Slashing Steel.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '142';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Skarmory';
  public fullName: string = 'Skarmory OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_CANNOT_USE_THIS_ATTACK_NEXT_TURN(effect.player, 'Slashing Steel');
    }

    return state;
  }
}
