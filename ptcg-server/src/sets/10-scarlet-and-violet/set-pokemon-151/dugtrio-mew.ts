import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';

export class Dugtrio extends PokemonCard {

  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Diglett';

  public cardType: CardType[] = [F];

  public hp: number = 90;

  public weakness = [{ type: G }];

  public retreat = [C];

  public attacks = [
    {
      name: 'Headbutt Bounce',
      cost: [F],
      damage: 40,
      text: '',
    },
    {
      name: 'Mud Bomb',
      cost: [F, F],
      damage: 80,
      text: '',
    },
  ];

  public regulationMark = 'G';

  public set: string = 'MEW';

  public setNumber: string = '51';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Dugtrio';

  public fullName: string = 'Dugtrio MEW';

  // Both attacks (Headbutt Bounce, Mud Bomb) have no printed effect, so no reduceEffect is required.
}
