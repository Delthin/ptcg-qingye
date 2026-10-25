import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Zweilous extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public cardType: CardType[] = [D];
  public hp: number = 100;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Bite',
      cost: [D],
      damage: 20,
      text: '',
    },
    {
      name: 'Hammer In',
      cost: [D, C],
      damage: 50,
      text: '',
    },
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '98';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Zweilous';
  public fullName: string = 'Zweilous 30C';
}
