import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../../game/store/card/card-types';

export class FomantisHappy6 extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.GRASS];
  public hp = 60;
  public weakness = [{ type: CardType.FIRE }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public regulationMark = 'I';

  public attacks = [
    {
      name: '切开',
      cost: [CardType.GRASS],
      damage: 20,
      text: ''
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '005';
  public name = 'Fomantis';
  public fullName = 'Fomantis CSVH6eC';
  public cardImage = 'assets/cardback.png';
}
