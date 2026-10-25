import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Diglett extends PokemonCard {

  public stage: Stage = Stage.BASIC;

  public cardType: CardType[] = [F];

  public hp: number = 50;

  public weakness = [{ type: G }];

  public retreat = [C];

  public attacks = [
    {
      name: 'Headbutt Bounce',
      cost: [F],
      damage: 10,
      text: ''
    },
    {
      name: 'Mud-Slap',
      cost: [F, F],
      damage: 30,
      text: ''
    }
  ];

  public regulationMark: string = 'G';

  public set: string = 'MEW';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '50';

  public name: string = 'Diglett';

  public fullName: string = 'Diglett MEW';
}
