import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Houndour extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 70;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Bite',
      cost: [D],
      damage: 10,
      text: '',
    },
    {
      name: 'Darkness Fang',
      cost: [D, D, D],
      damage: 70,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '132';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Houndour';
  public fullName: string = 'Houndour OBF';
}
