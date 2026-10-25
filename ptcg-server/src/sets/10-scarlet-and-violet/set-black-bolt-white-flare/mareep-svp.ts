import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Mareep extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 60;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Headbutt',
      cost: [L],
      damage: 10,
      text: '',
    },
    {
      name: 'Lightning Ball',
      cost: [L, C],
      damage: 20,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '107';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mareep';
  public fullName: string = 'Mareep SVP';
}
