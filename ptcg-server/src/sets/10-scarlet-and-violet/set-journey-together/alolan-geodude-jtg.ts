import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class AlolanGeodude extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 60;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Knuckle Punch',
      cost: [C],
      damage: 10,
      text: '',
    },
    {
      name: 'Tiny Charge',
      cost: [L, C],
      damage: 30,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '44';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Alolan Geodude';
  public fullName: string = 'Alolan Geodude JTG';
}
