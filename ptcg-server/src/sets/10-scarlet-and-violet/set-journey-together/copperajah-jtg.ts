import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Copperajah extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Cufant';
  public cardType: CardType[] = [M];
  public hp: number = 190;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Ram',
      cost: [M, M, C],
      damage: 100,
      text: '',
    },
    {
      name: 'Mega Impact',
      cost: [M, M, C, C],
      damage: 160,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '110';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Copperajah';
  public fullName: string = 'Copperajah JTG';
}
