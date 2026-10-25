import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Litleo extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 70;
  public weakness = [{ type: W }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Combustion',
      cost: [R],
      damage: 10,
      text: ''
    },
    {
      name: 'Headbutt',
      cost: [R, R, C],
      damage: 50,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '15';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Litleo';
  public fullName: string = 'Litleo PRE';
}
