import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Melmetal extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Meltan';
  public cardType: CardType[] = [M];
  public hp: number = 160;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Hammer In',
      cost: [M, M, C],
      damage: 120,
      text: '',
    },
    {
      name: 'Iron Bash',
      cost: [M, M, M, M, C],
      damage: 230,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '117';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Melmetal';
  public fullName: string = 'Melmetal TEF';
}
