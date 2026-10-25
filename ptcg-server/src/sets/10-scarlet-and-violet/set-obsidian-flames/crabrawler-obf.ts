import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Crabrawler extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 90;
  public weakness = [{ type: P }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Knuckle Punch',
      cost: [F, C],
      damage: 30,
      text: ''
    },
    {
      name: 'Magnum Punch',
      cost: [F, F, C],
      damage: 60,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '114';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Crabrawler';
  public fullName: string = 'Crabrawler OBF';
}
