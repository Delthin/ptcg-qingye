import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Quaxwell extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Quaxly';
  public cardType: CardType[] = [W];
  public hp: number = 90;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Water Gun',
      cost: [W],
      damage: 30,
      text: '',
    },
    {
      name: 'Wave Splash',
      cost: [W, C],
      damage: 50,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '51';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Quaxwell';
  public fullName: string = 'Quaxwell PAL';
}
