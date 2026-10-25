import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Snover extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 90;
  public weakness = [{ type: M }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Light Punch',
      cost: [C, C],
      damage: 20,
      text: ''
    },
    {
      name: 'Icicle',
      cost: [W, C, C],
      damage: 50,
      text: ''
    }
  ];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '59';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Snover';
  public fullName: string = 'Snover DRI';
}
