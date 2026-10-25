import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Horsea extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 60;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Rain Splash',
      cost: [W],
      damage: 10,
      text: '',
    },
    {
      name: 'Sharp Fin',
      cost: [W, C, C],
      damage: 40,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '116';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Horsea';
  public fullName: string = 'Horsea MEW';
}
