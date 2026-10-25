import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, THIS_ATTACK_DOES_X_MORE_DAMAGE } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_DOES_LESS_DAMAGE } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Marowak extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Cubone';
  public cardType: CardType[] = [F];
  public hp: number = 120;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Growl',
      cost: [F],
      damage: 0,
      text: 'During your opponent\'s next turn, attacks used by the Defending Pokémon do 40 less damage (before applying Weakness and Resistance).',
    },
    {
      name: 'Bone Vengeance',
      cost: [C, C],
      damage: 60,
      damageCalculation: '+',
      text: 'If any of your Benched Cubone have any damage counters on them, this attack does 120 more damage.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '73';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Marowak';
  public fullName: string = 'Marowak SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DEFENDING_POKEMON_DOES_LESS_DAMAGE(store, state, effect, this, 40);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      const hasDamagedCubone = player.bench.some(bench => {
        const pokemon = bench.getPokemonCard();
        return pokemon !== undefined && pokemon.name === 'Cubone' && bench.damage > 0;
      });

      if (hasDamagedCubone) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 120);
      }
    }

    return state;
  }
}
