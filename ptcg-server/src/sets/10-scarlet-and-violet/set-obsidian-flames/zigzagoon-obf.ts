import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Zigzagoon extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 70;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Headbutt Bounce',
      cost: [C],
      damage: 10,
      text: '',
    },
    {
      name: 'Claw Slash',
      cost: [C, C],
      damage: 20,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '167';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Zigzagoon';
  public fullName: string = 'Zigzagoon OBF';
}
