import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Deino extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 70;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Gnaw',
      cost: [D],
      damage: 10,
      text: '',
    },
    {
      name: 'Headbutt',
      cost: [D, C],
      damage: 20,
      text: '',
    },
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '97';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Deino';
  public fullName: string = 'Deino 30C';
}
