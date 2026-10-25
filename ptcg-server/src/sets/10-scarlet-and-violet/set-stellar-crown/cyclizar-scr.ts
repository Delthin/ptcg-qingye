import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Cyclizar extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 110;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Tail Snap',
      cost: [C],
      damage: 10,
      text: '',
    },
    {
      name: 'Speed Attack',
      cost: [C, C],
      damage: 50,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '127';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Cyclizar';
  public fullName: string = 'Cyclizar SCR';
}
