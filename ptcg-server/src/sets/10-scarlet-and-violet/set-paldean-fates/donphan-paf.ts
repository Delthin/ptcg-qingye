import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  DISCARD_TOP_X_OF_OPPONENTS_DECK,
  THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Donphan extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Phanpy';
  public cardType: CardType[] = [F];
  public hp: number = 150;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Cragalanche',
      cost: [C, C],
      damage: 30,
      text: 'Discard the top 2 cards of your opponent\'s deck.',
    },
    {
      name: 'Powerful Spin',
      cost: [F, F, C],
      damage: 160,
      text: 'During your next turn, this Pokémon can\'t attack.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '49';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Donphan';
  public fullName: string = 'Donphan PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Cragalanche: Discard the top 2 cards of your opponent's deck.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      DISCARD_TOP_X_OF_OPPONENTS_DECK(store, state, player, 2, this, effect);
    }

    // Powerful Spin: During your next turn, this Pokémon can't attack.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN(effect.player);
    }

    return state;
  }
}
