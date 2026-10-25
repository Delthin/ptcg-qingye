import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Greavard2 extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 70;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Gnaw',
      cost: [P],
      damage: 10,
      text: ''
    },
    {
      name: 'Spooky Shot',
      cost: [P, C],
      damage: 20,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '99';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Greavard';
  public fullName: string = 'Greavard OBF 99';
}
