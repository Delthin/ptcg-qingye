import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Fuecoco extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 80;
  public weakness = [{ type: W }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Gnaw',
      cost: [C],
      damage: 10,
      text: '',
    },
    {
      name: 'Combustion',
      cost: [R, R, C],
      damage: 50,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '36';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Fuecoco';
  public fullName: string = 'Fuecoco SVI';
}
