import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Herdier extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Lillipup';
  public cardType: CardType[] = [C];
  public hp: number = 90;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Rear Kick',
      cost: [C],
      damage: 30,
      text: '',
    },
    {
      name: 'Hammer In',
      cost: [C, C],
      damage: 50,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '171';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Herdier';
  public fullName: string = 'Herdier OBF';
}
