import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../../game/store/card/card-types';

export class NymbleHappy6 extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.GRASS];
  public hp = 50;
  public weakness = [{ type: CardType.FIRE }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public regulationMark = 'H';

  public attacks = [
    {
      name: '后踢',
      cost: [CardType.COLORLESS],
      damage: 20,
      text: ''
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '007';
  public name = 'Nymble';
  public fullName = 'Nymble CSVH6eC';
  public cardImage = 'assets/cardback.png';
}
