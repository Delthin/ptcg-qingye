import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Pelipper extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Wingull';
  public cardType: CardType[] = [W];
  public hp: number = 120;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Spit Up',
      cost: [C],
      damage: 30,
      text: ''
    },
    {
      name: 'Speed Dive',
      cost: [W, C],
      damage: 70,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '39';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pelipper';
  public fullName: string = 'Pelipper JTG';
}
