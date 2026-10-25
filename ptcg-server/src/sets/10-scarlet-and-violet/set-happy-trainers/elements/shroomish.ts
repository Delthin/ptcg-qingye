import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../../game/store/card/card-types';

export class ShroomishHappy6 extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.GRASS];
  public hp = 60;
  public weakness = [{ type: CardType.FIRE }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public regulationMark = 'I';

  public attacks = [
    {
      name: '滚动冲撞',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: 30,
      text: ''
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '002';
  public name = 'Shroomish';
  public fullName = 'Shroomish CSVH6eC';
  public cardImage = 'assets/cardback.png';
}
