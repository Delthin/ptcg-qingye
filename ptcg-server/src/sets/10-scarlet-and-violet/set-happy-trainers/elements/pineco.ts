import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../../game/store/card/card-types';

export class PinecoHappy6 extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.GRASS];
  public hp = 70;
  public weakness = [{ type: CardType.FIRE }];
  public resistance = [];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];
  public regulationMark = 'I';

  public attacks = [
    {
      name: '垂吊',
      cost: [CardType.COLORLESS],
      damage: 10,
      text: ''
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '001';
  public name = 'Pineco';
  public fullName = 'Pineco CSVH6eC';
  public cardImage = 'assets/cardback.png';
}
