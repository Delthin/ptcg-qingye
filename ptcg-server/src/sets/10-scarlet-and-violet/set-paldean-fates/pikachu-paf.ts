import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_DOES_LESS_DAMAGE } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Pikachu extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 70;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Growl',
      cost: [C],
      damage: 0,
      text: 'During your opponent\'s next turn, the Defending Pokémon\'s attacks do 20 less damage (before applying Weakness and Resistance).',
    },
    {
      name: 'Pika Bolt',
      cost: [L, C],
      damage: 30,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '131';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pikachu';
  public fullName: string = 'Pikachu PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DEFENDING_POKEMON_DOES_LESS_DAMAGE(store, state, effect, this, 20);
    }
    return state;
  }
}
