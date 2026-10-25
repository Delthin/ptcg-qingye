import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class HakamoO extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public cardType: CardType[] = [N];
  public hp: number = 90;
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Sharp Fang',
      cost: [C],
      damage: 20,
      text: '',
    },
    {
      name: 'Dragon Claw',
      cost: [L, F],
      damage: 70,
      text: '',
    },
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '111';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Hakamo-o';
  public fullName: string = 'Hakamo-o 30C';
}
