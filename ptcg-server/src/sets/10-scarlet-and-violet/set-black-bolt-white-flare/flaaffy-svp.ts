import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Flaaffy extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Mareep';
  public cardType: CardType[] = [L];
  public hp: number = 90;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Headbutt',
      cost: [L],
      damage: 20,
      text: ''
    },
    {
      name: 'Electro Ball',
      cost: [L, C],
      damage: 50,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '108';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Flaaffy';
  public fullName: string = 'Flaaffy SVP';
}
