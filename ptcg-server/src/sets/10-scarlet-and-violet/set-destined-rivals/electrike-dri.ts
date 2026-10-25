import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Electrike extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 60;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Rear Kick',
      cost: [C],
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

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '75';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Electrike';
  public fullName: string = 'Electrike DRI';
}
