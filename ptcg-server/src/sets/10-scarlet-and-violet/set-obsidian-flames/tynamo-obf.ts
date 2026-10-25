import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Tynamo extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 40;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Static Shock',
      cost: [L],
      damage: 10,
      text: '',
    },
    {
      name: 'Tiny Bolt',
      cost: [L, C],
      damage: 30,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '67';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tynamo';
  public fullName: string = 'Tynamo OBF';
}
