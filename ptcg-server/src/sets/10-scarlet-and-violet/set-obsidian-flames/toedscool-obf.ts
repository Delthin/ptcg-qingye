import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Toedscool extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 60;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Smash Kick',
      cost: [F],
      damage: 10,
      text: ''
    },
    {
      name: 'Mud-Slap',
      cost: [C, C],
      damage: 20,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '118';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Toedscool';
  public fullName: string = 'Toedscool OBF';
}
