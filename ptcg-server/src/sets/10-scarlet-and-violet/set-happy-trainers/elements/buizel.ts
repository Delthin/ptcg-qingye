import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../../game/store/card/card-types';

export class BuizelHappy6 extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.WATER];
  public hp = 70;
  public weakness = [{ type: CardType.LIGHTNING }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public regulationMark = 'I';

  public attacks = [
    {
      name: '摆尾拍击',
      cost: [CardType.COLORLESS],
      damage: 10,
      text: ''
    },
    {
      name: '飞溅',
      cost: [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS],
      damage: 30,
      text: ''
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '014';
  public name = 'Buizel';
  public fullName = 'Buizel CSVH6eC';
  public cardImage = 'assets/cardback.png';
}
