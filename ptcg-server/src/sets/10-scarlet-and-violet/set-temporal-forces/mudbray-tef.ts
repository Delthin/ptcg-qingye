import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Mudbray extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 80;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Smash Kick',
      cost: [F],
      damage: 10,
      text: '',
    },
    {
      name: 'Mud-Slap',
      cost: [F, C, C],
      damage: 50,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '91';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mudbray';
  public fullName: string = 'Mudbray TEF';
}
