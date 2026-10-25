import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Magneton extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Magnemite';
  public cardType: CardType[] = [L];
  public hp: number = 90;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Tackle',
      cost: [L],
      damage: 30,
      text: '',
    },
    {
      name: 'Electro Ball',
      cost: [L, C, C],
      damage: 60,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '64';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Magneton';
  public fullName: string = 'Magneton OBF';
}
