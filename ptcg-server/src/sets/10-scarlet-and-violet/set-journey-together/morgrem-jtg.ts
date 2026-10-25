import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Morgrem extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Impidimp';
  public cardType: CardType[] = [P];
  public hp: number = 90;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Light Punch',
      cost: [P],
      damage: 30,
      text: '',
    },
    {
      name: 'Smash Kick',
      cost: [P, C],
      damage: 50,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '72';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Morgrem';
  public fullName: string = 'Morgrem JTG';
}
