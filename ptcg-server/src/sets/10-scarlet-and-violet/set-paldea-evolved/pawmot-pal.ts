import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_BENCHED_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Pawmot extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Pawmo';
  public cardType: CardType[] = [L];
  public hp: number = 140;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Mach Bolt',
      cost: [L],
      damage: 40,
      text: '',
    },
    {
      name: 'Electric Fist',
      cost: [L, L],
      damage: 100,
      text: 'This attack also does 60 damage to 1 of your opponent\'s Benched Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '76';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pawmot';
  public fullName: string = 'Pawmot PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_BENCHED_POKEMON(60, effect, store, state);
    }
    return state;
  }
}
