import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_BENCHED_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Flamigo extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 120;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Peck',
      cost: [C],
      damage: 20,
      text: '',
    },
    {
      name: 'Synchronized Feathers',
      cost: [C, C],
      damage: 60,
      text: 'If Flamigo is on your Bench, this attack also does 60 damage to 1 of your opponent\'s Benched Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '185';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Flamigo';
  public fullName: string = 'Flamigo OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      const hasFlamigoOnBench = player.bench.some(
        bench => bench.cards.length > 0 && bench.getPokemonCard()?.name === this.name
      );
      const opponentHasBenchedPokemon = opponent.bench.some(bench => bench.cards.length > 0);

      if (hasFlamigoOnBench && opponentHasBenchedPokemon) {
        THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_BENCHED_POKEMON(60, effect, store, state);
      }
    }

    return state;
  }
}
