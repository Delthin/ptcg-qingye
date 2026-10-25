import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Tadbulb extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 50;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Tackle',
      cost: [C],
      damage: 10,
      text: '',
    },
    {
      name: 'Electro Ball',
      cost: [L, C],
      damage: 20,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '73';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tadbulb';
  public fullName: string = 'Tadbulb TWM';
}
