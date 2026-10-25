import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SWITCH_IN_OPPONENT_BENCHED_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Gloom extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Oddish';
  public cardType: CardType[] = [G];
  public hp: number = 80;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Inviting Scent',
      cost: [C],
      damage: 0,
      text: 'Switch in 1 of your opponent\'s Benched Pokémon to the Active Spot.',
    },
    {
      name: 'Leaf Step',
      cost: [G],
      damage: 20,
      text: '',
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '2';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Gloom';
  public fullName: string = 'Gloom OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;
      const hasBenchedPokemon = opponent.bench.some(bench => bench.cards.length > 0);

      if (hasBenchedPokemon) {
        return SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, player);
      }
    }

    return state;
  }
}
